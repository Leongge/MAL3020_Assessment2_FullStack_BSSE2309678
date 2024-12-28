import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { BrowserRouter } from 'react-router-dom'
import Flights from '../Flights'

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    off: vi.fn()
  })
}))

// Mock AOS
vi.mock('aos', () => ({
  default: {
    init: vi.fn()
  }
}))

// Mock react-datepicker
vi.mock('react-datepicker', () => {
  return {
    default: vi.fn(props => (
      <input
        type="text"
        onChange={e => props.onChange(new Date(e.target.value))}
        placeholder={props.placeholderText}
        data-testid={props['data-testid']}
      />
    ))
  }
})

const server = setupServer(
  http.get('http://localhost:3000/api/iata-codes', () => {
    return HttpResponse.json([
      { iataCode: 'KUL', city: 'Kuala Lumpur', airportName: 'Kuala Lumpur International Airport' },
      { iataCode: 'PEN', city: 'Penang', airportName: 'Penang International Airport' }
    ])
  }),

  http.get('http://localhost:3000/api/flights', () => {
    return HttpResponse.json([
      {
        _id: '1',
        airline: 'Malaysia Airlines',
        flightNumber: 'MH123',
        departureAirport: 'KUL',
        arrivalAirport: 'PEN',
        departureTime: '2024-12-27T10:00:00Z',
        arrivalTime: '2024-12-27T11:00:00Z',
        price: 299,
        availableSeats: 50,
        type: 'Economy',
        addons: [{ description: 'Extra Baggage', price: 50 }]
      }
    ])
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

describe('Flights Component Integration Tests', () => {
  const setup = () => {
    return render(
      <BrowserRouter>
        <Flights />
      </BrowserRouter>
    )
  }

  // Helper function to get date inputs
  const getDateInputs = () => {
    const departureDateContainer = screen.getByText('Departure').closest('.singleInput')
    const returnDateContainer = screen.getByText('Return').closest('.singleInput')
    
    return {
      departureDateInput: within(departureDateContainer).getByPlaceholderText('Add date'),
      returnDateInput: within(returnDateContainer).getByPlaceholderText('Add date')
    }
  }

  it('should load and display flight class options', () => {
    setup()
    expect(screen.getByText('Economy')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.getByText('First Class')).toBeInTheDocument()
  })

  it('should show location suggestions when typing in From field', async () => {
    setup()
    const fromInput = screen.getByPlaceholderText('Where')
    await userEvent.type(fromInput, 'KUL')
    
    await waitFor(() => {
      expect(screen.getByText(/Kuala Lumpur International Airport/)).toBeInTheDocument()
    })
  })

  it('should handle flight search with valid inputs', async () => {
    const user = userEvent.setup()
    setup()
    
    // Fill in search form
    const fromInput = screen.getByPlaceholderText('Where')
    const toInput = screen.getByPlaceholderText('Where you want to go')
    
    await user.type(fromInput, 'KUL')
    const kulSuggestion = await screen.findByText(/KUL - Kuala Lumpur/)
    await user.click(kulSuggestion)
    
    await user.type(toInput, 'PEN')
    const penSuggestion = await screen.findByText(/PEN - Penang/)
    await user.click(penSuggestion)
    
    // Select departure date using helper function
    const { departureDateInput } = getDateInputs()
    fireEvent.change(departureDateInput, { target: { value: '2024-12-27' } })
    
    // Click search button
    const searchButton = screen.getByText('Search Flight')
    await user.click(searchButton)
    
    // Verify flight results
    await waitFor(() => {
      expect(screen.getByText(/MH123/)).toBeInTheDocument()
      expect(screen.getByText(/RM299/)).toBeInTheDocument()
    })
  })

  it('should handle return trip selection', async () => {
    const user = userEvent.setup()
    setup()
    
    // Fill in search form
    const fromInput = screen.getByPlaceholderText('Where')
    const toInput = screen.getByPlaceholderText('Where you want to go')
    
    await user.type(fromInput, 'KUL')
    await user.click(await screen.findByText(/KUL - Kuala Lumpur/))
    
    await user.type(toInput, 'PEN')
    await user.click(await screen.findByText(/PEN - Penang/))
    
    // Set dates using helper function
    const { departureDateInput, returnDateInput } = getDateInputs()
    
    fireEvent.change(departureDateInput, { target: { value: '2024-12-27' } })
    fireEvent.change(returnDateInput, { target: { value: '2024-12-28' } })
    
    // Search flights
    await user.click(screen.getByText('Search Flight'))
    
    // Verify sections
    await waitFor(() => {
      expect(screen.getByText('Departure Flights')).toBeInTheDocument()
      expect(screen.getByText('Return Flights')).toBeInTheDocument()
    })
  })

  it('should show sign in modal when booking without login', async () => {
    const user = userEvent.setup()
    setup()
    localStorage.clear()
    
    // Search for flights
    const fromInput = screen.getByPlaceholderText('Where')
    const toInput = screen.getByPlaceholderText('Where you want to go')
    
    await user.type(fromInput, 'KUL')
    await user.click(await screen.findByText(/KUL - Kuala Lumpur/))
    
    await user.type(toInput, 'PEN')
    await user.click(await screen.findByText(/PEN - Penang/))
    
    // Set departure date using helper function
    const { departureDateInput } = getDateInputs()
    fireEvent.change(departureDateInput, { target: { value: '2024-12-27' } })
    
    await user.click(screen.getByText('Search Flight'))
    
    // Wait for and click flight card
    await waitFor(async () => {
      const flightCard = screen.getByText(/MH123/).closest('.flightCard')
      await user.click(flightCard)
    })
    
    // Verify sign in modal
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    })
  })
})