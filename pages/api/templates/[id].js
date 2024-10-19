import { abort } from 'process';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const templateId = parseInt(id);

  // Define the schema for updating a template
  const updateTemplateSchema = Yup.object().shape({
    title: Yup.string().max(100),
    code: Yup.string(),
    language: Yup.string().oneOf(['python', 'javascript', 'c', 'cpp', 'java']),
    explanation: Yup.string().max(500),
    tags: Yup.array().of(Yup.string().max(30)),
  });

  if (req.method === 'GET') {
    try {
      const template = await prisma.codeTemplate.findUnique({
        where: { id: templateId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          tags: true,

          // If the template is a fork, include the parent
          parent: {
            select: {
              id: true,
              title: true,
            },
          },

          // Include forks of the template
          forks: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.status(200).json({ template });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try{
        const validatedData = await updateTemplateSchema.validate(req.body, {abortEarly: false});

        // find the template
        const existedTemplate = await prisma.codeTemplate.findUnique({
            where: {id: templateId},
        });

        if (!existedTemplate) {
            return res.status(404).json({error: 'Template not found'});
        }

        // check if the user is the author of the template

        if (existedTemplate.authorId !== req.user.id) {
            return res.status(403).json({error: 'Forbidden'});
        }

        // Update

        // Update or connect tags
        let tagsData = undefined;
        if (validatedData.tags) {
            tagsData = {
            set: [], // Clear existing tags
            connectOrCreate: validatedData.tags.map((tagName) => ({
                where: { name: tagName },
                create: { name: tagName },
            })),
            };
        }

        const updatedTemplate = await prisma.codeTemplate.update({
            where: { id: templateId },
            data: {
                title: validatedData.title,
                code: validatedData.code,
                language: validatedData.language,
                explanation: validatedData.explanation,
                tags: tagsData,
            },
            include: {
              tags: true,
            },
          });

        res.status(200).json({ message: 'Template updated successfully', template: updatedTemplate });
    } catch (error) {
        if (error.name === 'ValidationError'){
            return res.status(400).json({errors: error.errors});
        }
        res.status(500).json({error: 'Internal server error'});
    }
  } else if (req.method === 'DELETE') {
    try {
        // Check if the template exists and the user is the author
        const existingTemplate = await prisma.codeTemplate.findUnique({
          where: { id: templateId },
        });
  
        if (!existingTemplate) {
          return res.status(404).json({ error: 'Template not found' });
        }
  
        if (existingTemplate.authorId !== req.user.id) {
          return res.status(403).json({ error: 'Forbidden' });
        }
  
        // Delete the template
        await prisma.codeTemplate.delete({
          where: { id: templateId },
        });
  
        res.status(200).json({ message: 'Template deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
