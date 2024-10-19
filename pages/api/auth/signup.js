import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { userSignupSchema } from '../../../validations/userValidation';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Validate input data
      const validatedData = await userSignupSchema.validate(req.body, { abortEarly: false });

      const { firstName, lastName, email, password, avatar, phoneNumber, role } = validatedData;

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create the user
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          avatar,
          phoneNumber,
          role: role || 'USER',
        },
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ errors: error.errors });
      }
      if (error.code === 'P2002') {
        // Unique constraint failed
        return res.status(400).json({ error: 'Email already in use' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}