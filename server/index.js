import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { db } from './db.js';
import { 
  registerUser, 
  loginUser, 
  getMe, 
  authenticateToken, 
  isAdmin,
  googleLogin
} from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth Routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.post('/api/auth/google-login', googleLogin);
app.get('/api/auth/me', authenticateToken, getMe);

// Public Trips Endpoint
app.get('/api/trips', async (req, res) => {
  try {
    const trips = await db.getTrips();
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching trips.' });
  }
});

app.get('/api/trips/:id/occupied', async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await db.getBookings();
    const activeBookings = bookings.filter(b => b.tripId === id && b.status !== 'cancelled');
    const occupiedSeats = activeBookings.flatMap(b => b.seats || []);
    res.json(occupiedSeats);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching occupied seats.' });
  }
});

// Bookings Routes (Customer)
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      pickupAddress, 
      pickupCity, 
      tripId,
      seats, // array of numbers
      paymentMethod
    } = req.body;

    if (!name || !phone || !pickupAddress || !pickupCity || !tripId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: 'All fields including at least one selected seat are required.' });
    }

    // Validate Trip
    const trips = await db.getTrips();
    const trip = trips.find(t => t.id === tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip package not found.' });
    }

    if (trip.status === 'completed') {
      return res.status(400).json({ error: 'Cannot book seats on a completed trip.' });
    }

    // Check Seat Collisions
    const bookings = await db.getBookings();
    const activeBookings = bookings.filter(b => b.tripId === tripId && b.status !== 'cancelled');
    const occupiedSeats = new Set(activeBookings.flatMap(b => b.seats || []));

    const duplicateSeats = seats.filter(seat => occupiedSeats.has(seat));
    if (duplicateSeats.length > 0) {
      return res.status(400).json({ 
        error: `Seats [${duplicateSeats.join(', ')}] are already booked. Please choose other seats.` 
      });
    }

    // Validate seat boundaries
    const invalidSeats = seats.filter(seat => seat < 1 || seat > trip.totalSeats);
    if (invalidSeats.length > 0) {
      return res.status(400).json({ 
        error: `Seats must be between 1 and ${trip.totalSeats}.` 
      });
    }

    const passengers = seats.length;
    const totalPrice = passengers * trip.price;

    const newBooking = {
      id: 'bkg-' + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      name,
      phone,
      pickupAddress,
      pickupCity,
      tripId,
      seats,
      passengers,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'unpaid',
      status: 'pending',
      totalPrice,
      createdAt: new Date().toISOString()
    };

    await db.saveBooking(newBooking);

    res.status(201).json({
      message: 'Booking created successfully!',
      booking: newBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error creating booking.' });
  }
});

app.get('/api/bookings/my', authenticateToken, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    const trips = await db.getTrips();
    
    // Filter and join with trip details
    const userBookings = bookings
      .filter(b => b.userId === req.user.id)
      .map(b => {
        const trip = trips.find(t => t.id === b.tripId);
        return { ...b, trip };
      });
      
    res.json(userBookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching bookings.' });
  }
});

// Admin Booking Endpoints
app.get('/api/admin/bookings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    const trips = await db.getTrips();
    const users = await db.getUsers();
    
    // Join with trip and customer user info
    const joinedBookings = bookings.map(b => {
      const trip = trips.find(t => t.id === b.tripId);
      const user = users.find(u => u.id === b.userId);
      return { 
        ...b, 
        trip,
        customerUsername: user ? user.username : 'Unknown'
      };
    });

    const sortedBookings = joinedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedBookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching all bookings.' });
  }
});

app.put('/api/admin/bookings/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const bookings = await db.getBookings();
    const booking = bookings.find(b => b.id === id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const updates = {};
    if (status) {
      if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid booking status.' });
      }
      updates.status = status;
    }

    if (paymentStatus) {
      if (!['unpaid', 'paid'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status.' });
      }
      updates.paymentStatus = paymentStatus;
    }

    await db.updateBooking(id, updates);
    res.json({
      message: 'Booking updated successfully',
      booking: { ...booking, ...updates }
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Server error updating booking.' });
  }
});

// Admin Trips Endpoints (CRUD)
app.post('/api/admin/trips', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, destination, startDate, endDate, price, description, descriptionHi, busType, totalSeats } = req.body;

    if (!title || !destination || !startDate || !endDate || !price || !description || !descriptionHi) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const newTrip = {
      id: 'trip-' + Math.random().toString(36).substr(2, 9),
      title,
      destination,
      startDate,
      endDate,
      price: Number(price),
      busType: busType || 'AC Volvo Luxury Bus',
      totalSeats: Number(totalSeats) || 65,
      status: 'upcoming',
      description,
      descriptionHi,
      createdAt: new Date().toISOString()
    };

    await db.saveTrip(newTrip);

    res.status(201).json({
      message: 'Trip package created successfully',
      trip: newTrip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Server error creating trip.' });
  }
});

app.put('/api/admin/trips/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, destination, startDate, endDate, price, description, descriptionHi, status, busType, totalSeats } = req.body;

    const trips = await db.getTrips();
    const trip = trips.find(t => t.id === id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Merge changes
    const updated = {
      ...trip,
      ...(title && { title }),
      ...(destination && { destination }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(price !== undefined && { price: Number(price) }),
      ...(description && { description }),
      ...(descriptionHi && { descriptionHi }),
      ...(status && { status }),
      ...(busType && { busType }),
      ...(totalSeats !== undefined && { totalSeats: Number(totalSeats) }),
    };

    await db.saveTrip(updated);

    res.json({
      message: 'Trip updated successfully',
      trip: updated
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Server error updating trip.' });
  }
});

app.delete('/api/admin/trips/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const trips = await db.getTrips();
    const trip = trips.find(t => t.id === id);
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    await db.deleteTrip(id);
    res.json({ message: 'Trip deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting trip.' });
  }
});

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await db.getUsers();
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching users.' });
  }
});

// Serve frontend in production
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server (only locally, not in Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
