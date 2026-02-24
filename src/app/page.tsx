import { createClient } from '@/utils/supabase/server';
import { Book } from '@/types/database.types';
import ClientHome from '@/components/ClientHome';

export const dynamic = 'force-dynamic';

async function getBooks() {
  const supabase = await createClient();
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching books:', error);
    return [];
  }

  return books as Book[];
}

export default async function Home() {
  const books = await getBooks();

  return <ClientHome initialBooks={books} />;
}
