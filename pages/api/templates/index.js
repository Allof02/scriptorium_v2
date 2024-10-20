import prisma from '../../../lib/prisma';
import { authenticateToken } from '../../../lib/authMiddleware';
import * as Yup from 'yup';

const createTemplateSchema = Yup.object().shape({
  title: Yup.string().required().max(100),
  code: Yup.string().required(),
  language: Yup.string().required().oneOf(['python', 'javascript', 'c', 'cpp', 'java']),
  explanation: Yup.string().max(500),
  tags: Yup.array().of(Yup.string().max(30)),
});

async function handler(req, res) {
  if (req.method === 'POST') {
    // Create a new code template
    // only authenticated users can create templates
    return authenticateToken(async (req, res) => {
    try {
      const validatedData = await createTemplateSchema.validate(req.body, { abortEarly: false });
      const { title, code, language, explanation, tags } = validatedData;

      // Create or connect tags
      const tagConnectOrCreate = tags?.map((tagName) => ({
        where: { name: tagName },
        create: { name: tagName },
      }));

      const template = await prisma.codeTemplate.create({
        data: {
          title,
          code,
          language,
          explanation,
          author: { connect: { id: req.user.id } },
          authorId: req.user.id,
          tags: { connectOrCreate: tagConnectOrCreate },
          isFork: false,
        },
        include: {
          tags: true,
        },
      });

      res.status(201).json({ message: 'Template created successfully', template });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
    })(req, res);
  } else if (req.method === 'GET') {
    
    // Extract searching filters
    const { search, tags, language, page = 1, limit = 10 } = req.query;

    // set up filters
    const whereClause = {};

    if (search) {
        
        // Prisma OR filter
        // search for title, code, and explanation
        // in a case-insensitive manner
        whereClause.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { explanation: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tags) {
      const tagsArray = tags.split(',');
      whereClause.tags = {
        // Some in Prisma is for many-to-many relationships
        some: {
          name: { in: tagsArray }, // Filter where tag names are in the tagsArray
        },
      };
    }

    if (language) {
      whereClause.language = language; // Strict equality: only templates where the language matches the provided value will be returned.
    }

    // Start querying the database
    const templates = await prisma.codeTemplate.findMany({
      where: whereClause,
      include: {
        // Want author's id, firstName, and lastName, and all tags
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ templates });
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default handler;