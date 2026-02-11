import Header from '@/components/Header';
import FilterChips from '@/components/FilterChips';
import BookCard from '@/components/BookCard';
import styles from './page.module.css';

// Dummy Data
const books = [
  {
    id: 1,
    title: "The Midnight Library",
    author: "Matt Haig",
    price: 14.99,
    category: "Fiction",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 2,
    title: "Grid Systems",
    author: "Josef Müller-Brockmann",
    price: 45.00,
    category: "Design",
    coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
    tag: "Bestseller"
  },
  {
    id: 3,
    title: "Devotions",
    author: "Mary Oliver",
    price: 22.50,
    category: "Poetry",
    coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 4,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    price: 18.99,
    category: "Non-Fiction",
    coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800", // Placeholder reuse
  },
  {
    id: 5,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    price: 12.00,
    category: "Classics",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800", // Placeholder reuse
  },
  {
    id: 6,
    title: "The Silk Roads",
    author: "Peter Frankopan",
    price: 16.50,
    originalPrice: 22.00,
    category: "History",
    coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800", // Placeholder reuse
    tag: "Sale"
  },
  {
    id: 7,
    title: "Meditations",
    author: "Marcus Aurelius",
    price: 10.99,
    category: "Philosophy",
    coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800", // Placeholder reuse
  },
  {
    id: 8,
    title: "Dune",
    author: "Frank Herbert",
    price: 19.99,
    category: "Sci-Fi",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800", // Placeholder reuse
  }
];

export default function Home() {
  return (
    <main className={styles.main}>
      <Header />

      <div className={`container ${styles.content}`}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Curated pages for the <span className={styles.highlight}>modern mind</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Discover our limited selection of monthly reads, hand-picked for quality and depth.
          </p>
        </section>

        <nav className={styles.filters}>
          <FilterChips />
        </nav>

        <section className={styles.grid}>
          {books.map((book) => (
            <BookCard
              key={book.id}
              {...book}
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
