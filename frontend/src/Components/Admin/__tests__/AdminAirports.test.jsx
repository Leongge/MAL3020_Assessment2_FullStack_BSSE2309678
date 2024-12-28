import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import AdminAirports from '../AdminAirports'

// Mock AOS
vi.mock('aos', () => ({
  default: {
    init: vi.fn()
  }
}))

const mockIataCodes = [
  {
    _id: '1',
    iataCode: 'KUL',
    airportName: 'Kuala Lumpur International Airport',
    city: 'Kuala Lumpur',
    country: 'Malaysia'
  },
  {
    _id: '2',
    iataCode: 'PEN',
    airportName: 'Penang International Airport',
    city: 'Penang',
    country: 'Malaysia'
  }
]

// Keep track of the current IATA codes
let currentIataCodes = [...mockIataCodes];

const server = setupServer(
  http.get('http://localhost:3000/api/iata-codes', () => {
    return HttpResponse.json(currentIataCodes)
  }),

  http.post('http://localhost:3000/api/iata-codes', async ({ request }) => {
    const newIataCode = await request.json()
    const iataWithId = { ...newIataCode, _id: '3' }
    currentIataCodes = [...currentIataCodes, iataWithId]
    return HttpResponse.json(iataWithId)
  }),

  http.put('http://localhost:3000/api/iata-codes/:id', async ({ request }) => {
    const updatedIataCode = await request.json()
    const id = request.url.split('/').pop()
    currentIataCodes = currentIataCodes.map(iata => 
      iata._id === id ? { ...updatedIataCode, _id: id } : iata
    )
    return HttpResponse.json({ ...updatedIataCode, _id: id })
  }),

  http.delete('http://localhost:3000/api/iata-codes/:id', ({ params }) => {
    const { id } = params
    currentIataCodes = currentIataCodes.filter(iata => iata._id !== id)
    return new HttpResponse(null, { status: 200 })
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  // Reset the mock data
  currentIataCodes = [...mockIataCodes]
})
afterAll(() => server.close())

describe('AdminAirports Component Integration Tests', () => {
  const setup = () => {
    return render(<AdminAirports />)
  }

  it('should load and display existing IATA codes', async () => {
    setup()
    
    await waitFor(() => {
      expect(screen.getByTestId('iata-code-1')).toHaveTextContent('KUL')
      expect(screen.getByText('Kuala Lumpur International Airport')).toBeInTheDocument()
      expect(screen.getByText('Penang')).toBeInTheDocument()
    })
  })

  it('should open modal when add IATA code button is clicked', async () => {
    const user = userEvent.setup()
    setup()
    
    await user.click(screen.getByTestId('add-iata-button'))
    
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Add New IATA Code')
    expect(screen.getByTestId('iata-code-input')).toBeInTheDocument()
    expect(screen.getByTestId('airport-name-input')).toBeInTheDocument()
  })

  it('should create a new IATA code', async () => {
    const user = userEvent.setup()
    setup()
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByTestId('iata-code-1')).toBeInTheDocument()
    })
    
    // Click add button
    await user.click(screen.getByTestId('add-iata-button'))
    
    // Fill in the form
    await user.type(screen.getByTestId('iata-code-input'), 'SIN')
    await user.type(screen.getByTestId('airport-name-input'), 'Singapore Changi Airport')
    await user.type(screen.getByTestId('city-input'), 'Singapore')
    await user.type(screen.getByTestId('country-input'), 'Singapore')
    
    // Submit form
    await user.click(screen.getByTestId('submit-iata-button'))
    
    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByTestId('modal-title')).not.toBeInTheDocument()
    })
    
    // Verify new IATA code is added
    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      const newRow = Array.from(rows).find(row => row.textContent.includes('SIN'))
      expect(newRow).toBeInTheDocument()
      expect(newRow).toHaveTextContent('Singapore Changi Airport')
    })
  })

  it('should edit an existing IATA code', async () => {
    const user = userEvent.setup()
    setup()
    
    // Wait for IATA codes to load
    await waitFor(() => {
      expect(screen.getByTestId('iata-code-1')).toBeInTheDocument()
    })

    // Click edit button for first IATA code
    await user.click(screen.getByTestId('edit-iata-1'))
    
    // Clear and update airport name
    const airportNameInput = screen.getByTestId('airport-name-input')
    await user.clear(airportNameInput)
    await user.type(airportNameInput, 'KLIA')
    
    // Submit changes
    await user.click(screen.getByTestId('submit-iata-button'))
    
    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByTestId('modal-title')).not.toBeInTheDocument()
    })
    
    // Verify changes
    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      const updatedRow = Array.from(rows).find(row => row.textContent.includes('KUL'))
      expect(updatedRow).toHaveTextContent('KLIA')
    })
  })

  it('should delete an IATA code', async () => {
    const user = userEvent.setup()
    setup()
    
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
    
    // Wait for IATA codes to load
    await waitFor(() => {
      expect(screen.getByTestId('delete-iata-1')).toBeInTheDocument()
    })

    // Get initial number of rows
    const initialRows = screen.getAllByRole('row')
    const initialCount = initialRows.length

    // Click delete button for first IATA code
    await user.click(screen.getByTestId('delete-iata-1'))
    
    // Verify IATA code is removed
    await waitFor(() => {
      const currentRows = screen.getAllByRole('row')
      expect(currentRows.length).toBe(initialCount - 1)
      expect(screen.queryByText('Kuala Lumpur International Airport')).not.toBeInTheDocument()
    })
  })

  it('should handle server errors when fetching IATA codes', async () => {
    // Mock console.error to prevent error logs in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    // Override server handler to return error
    server.use(
      http.get('http://localhost:3000/api/iata-codes', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )
    
    setup()
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to fetch IATA codes')
    })
    
    consoleSpy.mockRestore()
    alertSpy.mockRestore()
  })
})