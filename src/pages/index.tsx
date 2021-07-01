import { useState } from 'react';
import Head from 'next/head'
import Link from 'next/link'
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client'
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

import { FiCalendar, FiUser } from 'react-icons/fi'

import commonStyles from '../styles/common.module.scss';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR
        }
      )
    }
  })
  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);


  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }
    const postsResults = await fetch(nextPage).then(response =>
      response.json())


    setNextPage(postsResults.next_page)
    setCurrentPage(postsResults.page)

    const newPosts = postsResults.results.map(post => (
      {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        }
      }
    ))
    setPosts([...posts, ...newPosts])
  }

  return (
    <>
      <Head>
        <title>spacetravelling | Home </title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.posts} >
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`} >
              <a >
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <ul>
                  <li>
                    <FiCalendar />
                    <span>{post.first_publication_date}</span>
                  </li>
                  <li>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </li>
                </ul>
              </a>
            </Link>
          ))}
          {nextPage && (
            <button type='button' onClick={handleNextPage}>
              Carregar mais posts
            </button>
          )}
        </div>

      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.content'],
    pageSize: 1,
    orderings: '[document.last_publication_data desc]'
  }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })


  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts
  }

  return {
    props: {
      postsPagination
    }
  }
};
