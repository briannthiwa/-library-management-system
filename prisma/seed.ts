import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const catalog: Record<string, { title: string; author: string; year: number }[]> = {
  'Science Fiction': [
    { title: 'Dune', author: 'Frank Herbert', year: 1965 },
    { title: 'Neuromancer', author: 'William Gibson', year: 1984 },
    { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', year: 1969 },
    { title: 'Binti', author: 'Nnedi Okorafor', year: 2015 },
  ],
  Fantasy: [
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937 },
    { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', year: 1968 },
    { title: 'Who Fears Death', author: 'Nnedi Okorafor', year: 2010 },
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', year: 2007 },
  ],
  History: [
    { title: 'Sapiens', author: 'Yuval Noah Harari', year: 2011 },
    { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', year: 1997 },
    { title: 'The Fish Can Sing', author: 'Halldór Laxness', year: 1957 },
    { title: 'Africa: A Biography of the Continent', author: 'John Reader', year: 1997 },
  ],
  Technology: [
    { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', year: 1999 },
    { title: 'Clean Code', author: 'Robert C. Martin', year: 2008 },
    { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', year: 2017 },
    { title: 'The Phoenix Project', author: 'Gene Kim', year: 2013 },
  ],
};

async function main() {
  // Clear in dependency order so the seed can be re-run safely
  await prisma.review.deleteMany();
  await prisma.book.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.user.deleteMany();

  // Seed default librarian account
  const hashedPassword = await bcrypt.hash('Librarian123!', 10);
  const librarian = await prisma.user.upsert({
    where: { email: 'librarian@library.com' },
    update: {},
    create: {
      email: 'librarian@library.com',
      name: 'Head Librarian',
      password: hashedPassword,
      role: Role.LIBRARIAN,
    },
  });
  console.log(`Seeded librarian account: ${librarian.email}`);

  // Seed default patron account for testing
  const patronPassword = await bcrypt.hash('Patron123!', 10);
  const patron = await prisma.user.upsert({
    where: { email: 'patron@library.com' },
    update: {},
    create: {
      email: 'patron@library.com',
      name: 'Book Lover',
      password: patronPassword,
      role: Role.PATRON,
    },
  });
  console.log(`Seeded patron account: ${patron.email}`);

  for (const [genreName, books] of Object.entries(catalog)) {
    await prisma.genre.create({
      data: {
        name: genreName,
        books: {
          create: books.map((b) => ({
            title: b.title,
            author: b.author,
            publishedYear: b.year,
            copies: 3,
          })),
        },
      },
    });
  }

  const genres = await prisma.genre.count();
  const books = await prisma.book.count();
  const users = await prisma.user.count();
  console.log(`Seeded ${genres} genres, ${books} books, and ${users} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
