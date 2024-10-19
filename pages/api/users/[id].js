
// get specific user by id

import prisma from '../../../lib/prisma';
import { authenticateToken } from '../../../lib/authMiddleware';

async function handler(req, res) {
  const { id } = req.query;
  const userId = parseInt(id);

  if (req.method === 'GET') {
    
    // Question: can other users see other users' profiles?
    // if (req.user.id !== userId && req.user.role !== 'ADMIN') {
    //   return res.status(403).json({ error: 'Forbidden' });
    // }

    // Here I assume that everyone can see other users' profiles
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
        // Check if the authenticated user is updating their own profile or is an admin
        // Only admins can update other users' profiles, and only the user themselves can update their own profile
        if (req.user.id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
          }
      
          try {
            // Validate input data
            const validatedData = await userUpdateSchema.validate(req.body, { abortEarly: false });
      
            // Prevent role change unless the user is an admin
            if (validatedData.role && req.user.role !== 'ADMIN') {
              delete validatedData.role;
            }
      
            const updatedUser = await prisma.user.update({
              where: { id: userId },
              data: validatedData,
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            });
      
            res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
          } catch (error) {
            if (error.name === 'ValidationError') {
              return res.status(400).json({ errors: error.errors });
            }
            // if (error.code === 'P2002') {
            //   // Unique constraint failed (e.g., email already in use)
            //   return res.status(400).json({ error: 'Email already in use' });
            // }
            res.status(500).json({ error: 'Internal server error' });
          }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// pass to check valid token
export default authenticateToken(handler);