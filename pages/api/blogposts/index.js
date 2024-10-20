import prisma from '../../../lib/prisma';
import { authenticateToken } from '../../../lib/authMiddleware';
import * as Yup from 'yup';
import { stat } from 'fs';

// Validation schema for creating a blog post
const createBlogPostSchema = Yup.object().shape({
  title: Yup.string().required().max(100),
  description: Yup.string().required().max(500),
  tags: Yup.array().of(Yup.string().max(30)),
  codeTemplates: Yup.array().of(Yup.number()), // Array of template IDs
});

async function handler(req, res) {
  if (req.method === 'POST') {
    // Apply authentication middleware
    return authenticateToken(async (req, res) => {
      try {
        // Validate incoming data
        const validatedData = await createBlogPostSchema.validate(req.body, { abortEarly: false });
        const { title, description, tags, codeTemplates } = validatedData;

        // Prepare tags
        const tagConnectOrCreate = tags?.map((tagName) => ({
          where: { name: tagName },
          create: { name: tagName },
        }));

        // Prepare code templates
        const templateConnect = codeTemplates?.map((templateId) => ({
          id: templateId,
        }));

        // Create the blog post in the database
        const blogPost = await prisma.blogPost.create({
          data: {
            title,
            description,
            author: { connect: { id: req.user.id } },
            tags: { connectOrCreate: tagConnectOrCreate },
            codeTemplates: { connect: templateConnect },
            status: 'PUBLISHED',
          },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            tags: true,
            codeTemplates: true,
          },
        });

        res.status(201).json({ message: 'Blog post created successfully', blogPost });
      } catch (error) {
        if (error.name === 'ValidationError') {
          return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
      }
    })(req, res);
  } else if (req.method === 'GET') {
    try {
        const { search, tags, page = 1, limit = 10 } = req.query;
    
        // Initialize filters
        const whereClause = {};
    
        if (search) {
          whereClause.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }
    
        if (tags) {
          const tagsArray = tags.split(',');
          whereClause.tags = {
            some: {
              name: { in: tagsArray },
            },
          };
        }
    
        // Fetch blog posts from the database
        const blogPosts = await prisma.blogPost.findMany({
          where: whereClause,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            tags: true,
            status: true, // Include the status field to ensure that only published blog posts are displayed (Feature in Frontend)
            codeTemplates: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
    
        res.status(200).json({ blogPosts });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default handler;
