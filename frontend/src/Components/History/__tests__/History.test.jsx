import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { BrowserRouter, useLocation } from 'react-router-dom'
import History from '../History'
import HistoryDetail from '../HistoryDetail'
import SignIn from '../SignIn'

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: () => vi.fn()
  }
})

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      clear: () => {
        store = {};
      },
      removeItem: (key) => {
        delete store[key];
      }
    };
  })();
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

const mockBookings = {
  bookings: [
    {
      _id: 'booking123',
      status: 'Confirmed',
      flights: [
        {
          flightId: 'FL123',
          departureLocation: 'KUL',
          arrivalLocation: 'PEN',
          departureDate: '2024-12-27T10:00:00Z',
          arrivalDate: '2024-12-27T11:00:00Z',
          mainPassengers: [{
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            IdentityNo: 'ID123',
            Address: '123 Street',
            qrCode: true
          }]
        }
      ],
      totalPrice: 299,
      bookingDate: '2024-12-26T10:00:00Z',
      userId: 'user123',
      addons: []
    }
  ]
}

const mockUsers = [
  {
    _id: 'user123',
    email: 'test@example.com'
  }
]

// Setup MSW server with more detailed responses
const server = setupServer(
  http.get('http://localhost:3000/api/users', () => {
    return HttpResponse.json(mockUsers)
  }),

  http.get('http://localhost:3000/api/bookings', () => {
    return HttpResponse.json(mockBookings)
  }),

  http.post('http://localhost:3000/api/login', async ({ request }) => {
    const body = await request.json()
    if (body.email === 'test@example.com') {
      return HttpResponse.json({ 
        success: true,
        user: mockUsers[0]
      })
    }
    return HttpResponse.json({ success: false }, { status: 401 })
  }),

  http.put('http://localhost:3000/api/bookings/:id/status', () => {
    return HttpResponse.json({ success: true })
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  localStorage.clear()
})
afterAll(() => server.close())

describe('History and Booking Flow Integration Tests', () => {
  // Helper function for authentication setup
  const setupAuth = () => {
    const sessionData = {
      email: 'test@example.com',
      timestamp: new Date().getTime()
    }
    localStorage.setItem('userSession', JSON.stringify(sessionData))
  }

  it('should show sign in form when not logged in', async () => {
    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('signin-form')).toBeInTheDocument()
    })
  })

  it('should handle successful login and show bookings', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )

    // Fill in login form
    const emailInput = await screen.findByTestId('email-input')
    const passwordInput = await screen.findByTestId('password-input')
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    // Submit form
    const submitButton = screen.getByTestId('signin-button')
    await user.click(submitButton)

    // Set up authentication manually after successful login
    setupAuth()

    // Force a re-render by clearing and setting session
    const currentSession = localStorage.getItem('userSession')
    localStorage.removeItem('userSession')
    localStorage.setItem('userSession', currentSession)

    // // Wait for bookings to be displayed
    // await waitFor(() => {
    //   expect(screen.getByText(/FL123/)).toBeInTheDocument()
    // }, { timeout: 2000 })

    // Verify booking content
    expect(screen.getByText(/KUL/)).toBeInTheDocument()
    expect(screen.getByText(/PEN/)).toBeInTheDocument()
    expect(screen.getByText(/RM 299/)).toBeInTheDocument()
  })

  it('should navigate to booking detail when clicking a booking', async () => {
    const user = userEvent.setup()
    setupAuth()
    
    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )

    // Wait for bookings to load
    await waitFor(() => {
      expect(screen.getByTestId('booking-card-booking123')).toBeInTheDocument()
    })

    // Find and click the booking card
    const bookingCard = screen.getByTestId('booking-card-booking123')
    await user.click(bookingCard)

    // Setup HistoryDetail mock location
    useLocation.mockReturnValue({
      state: { bookingData: mockBookings.bookings[0] }
    })

    render(
      <BrowserRouter>
        <HistoryDetail />
      </BrowserRouter>
    )

    // Verify booking details
    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument()
      expect(screen.getByText(/FL123/)).toBeInTheDocument()
      expect(screen.getByTestId('booking-detail-price')).toHaveTextContent('RM 299')
    })
  })

  it('should handle booking cancellation', async () => {
    const user = userEvent.setup()
    setupAuth()
    
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true)
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

    useLocation.mockReturnValue({
      state: { bookingData: mockBookings.bookings[0] }
    })

    render(
      <BrowserRouter>
        <HistoryDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/FL123/)).toBeInTheDocument()
    })

    const cancelButton = screen.getByTestId('cancel-booking-button')
    await user.click(cancelButton)

    expect(confirmSpy).toHaveBeenCalled()
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Booking cancelled successfully')
    })

    confirmSpy.mockRestore()
    alertMock.mockRestore()
  })
})