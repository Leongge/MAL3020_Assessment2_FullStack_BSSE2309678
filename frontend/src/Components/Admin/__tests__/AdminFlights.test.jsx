import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import AdminFlights from '../AdminFlights'

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
        value={props.selected ? props.selected.toISOString() : ''}
        data-testid={props['data-testid']}
      />
    ))
  }
})

const mockFlights = [
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
    addons: []
  }
]

const mockIataCodes = [
  { _id: '1', iataCode: 'KUL', city: 'Kuala Lumpur', airportName: 'Kuala Lumpur International Airport' },
  { _id: '2', iataCode: 'PEN', city: 'Penang', airportName: 'Penang International Airport' }
]

const server = setupServer(
  http.get('http://localhost:3000/api/flights', () => {
    return HttpResponse.json(mockFlights)
  }),

  http.get('http://localhost:3000/api/iata-codes', () => {
    return HttpResponse.json(mockIataCodes)
  }),

  http.post('http://localhost:3000/api/flights', async ({ request }) => {
    const flight = await request.json()
    return HttpResponse.json({ ...flight, _id: '2' })
  }),

  http.put('http://localhost:3000/api/flights/:id', async ({ request }) => {
    const updatedFlight = await request.json()
    mockFlights[0] = { ...mockFlights[0], ...updatedFlight }
    return HttpResponse.json(mockFlights[0])
}),

  http.get('http://localhost:3000/api/flights', () => {
        return HttpResponse.json(mockFlights)
    }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

describe('AdminFlights Component Integration Tests', () => {
  const setup = () => {
    return render(<AdminFlights />)
  }

  it('should load and display existing flights', async () => {
    setup()
    
    await waitFor(() => {
      expect(screen.getByText(/MH123/)).toBeInTheDocument()
      expect(screen.getByText('Route: KUL → PEN')).toBeInTheDocument()
      expect(screen.getByText(/Price: RM299/)).toBeInTheDocument()
    })
  })

  it('should open modal when add flight button is clicked', async () => {
    setup()
    
    const addButton = screen.getByTestId('add-flight-button')
    await userEvent.click(addButton)
    
    expect(screen.getByTestId('modal-title')).toBeInTheDocument()
    expect(screen.getByTestId('airline-input')).toBeInTheDocument()
  })

  it('should edit an existing flight', async () => {
    const user = userEvent.setup()
    setup()
    
    // Wait for flights to load
    await waitFor(() => {
        expect(screen.getByTestId('flight-title-1')).toHaveTextContent('MH123')
    })

    // Click edit button and wait for modal
    const editButton = screen.getByTestId('edit-flight-1')
    await user.click(editButton)
    
    // Wait for edit modal to appear
    await waitFor(() => {
        expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Flight')
    })

    // Get input by test id
    const flightNumberInput = screen.getByTestId('flight-number-input')
    
    // Clear and update flight number
    await user.clear(flightNumberInput)
    await user.type(flightNumberInput, 'MH456')
    
    // Submit changes
    const updateButton = screen.getByTestId('submit-flight-button')
    await user.click(updateButton)
    
    // Verify changes
    await waitFor(() => {
        expect(screen.getByTestId('flight-title-1')).toHaveTextContent('MH456')
    })
  })

  it('should delete a flight', async () => {
    const user = userEvent.setup()
    setup()
    
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
    
    // Wait for flights to load
    await waitFor(() => {
        expect(screen.getByTestId('flight-title-1')).toHaveTextContent('Malaysia Airlines - MH456')
    })

    // Click delete button
    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)
    
    // Verify flight is removed
    await waitFor(() => {
      expect(screen.queryByText('MH456')).not.toBeInTheDocument()
    })
  })

  it('should handle add-ons in flight creation', async () => {
    const user = userEvent.setup()
    setup()
    
    // Open modal
    await user.click(screen.getByTestId('add-flight-button'))
    
    // Add an add-on
    await user.click(screen.getByRole('button', { name: /add add-on/i }))
    
    // Fill add-on details using test IDs
    await user.type(screen.getByTestId('addon-type-0'), 'Extra Baggage')
    await user.type(screen.getByTestId('addon-description-0'), '20kg additional baggage')
    await user.type(screen.getByTestId('addon-price-0'), '50')
    
    // Verify add-on fields are filled
    expect(screen.getByTestId('addon-type-0')).toHaveValue('Extra Baggage')
    expect(screen.getByTestId('addon-description-0')).toHaveValue('20kg additional baggage')
    expect(screen.getByTestId('addon-price-0')).toHaveValue(50)
  })
})