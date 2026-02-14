import Header from '@/components/Header';
import FilterChips from '@/components/FilterChips';
import BookCard from '@/components/BookCard';
import styles from './page.module.css';
import { supabase } from '@/lib/supabaseClient';
import { Book } from '@/types/database.types';

// Force dynamic rendering to ensure we get fresh data
export const dynamic = 'force-dynamic';

async function getBooks() {
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching books:', error);
    return [];
  }

  return books as Book[];
}

export default async function Home() {
  const books = await getBooks();

  return (
    <main className={styles.main}>
      <Header />

      <div className={`container ${styles.content}`}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Visit many good books <span className={styles.highlight}>but live in the Bible</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Discover the selection of books available at the Heritage Book Table
          </p>
        </section>

        <nav className={styles.filters}>
          <FilterChips />
        </nav>

        <section className={styles.grid}>
          {books.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              price={book.price}
              originalPrice={book.retail > book.price ? book.retail : undefined}
              coverImage={book.image_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'}
              category={book.category}
            />
          ))}
        </section>

        <div className={styles.viewMore}>
          <button className={styles.viewMoreBtn}>View All Titles →</button>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerContent}`}>
          <div className={styles.newsletter}>
            <h2 className={styles.newsletterTitle}>Join our literary circle</h2>
            <p className={styles.newsletterText}>Receive curated book recommendations, early access to limited editions, and exclusive author interviews.</p>
            <div className={styles.inputGroup}>
              <input type="email" placeholder="Enter your email" className={styles.emailInput} />
              <button className={styles.subscribeBtn}>Subscribe</button>
            </div>
          </div>

          <div className={styles.footerLinks}>
            <p className={styles.copyright}>© 2026 Book Table Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
