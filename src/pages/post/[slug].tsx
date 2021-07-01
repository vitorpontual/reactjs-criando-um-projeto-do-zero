import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import Head from 'next/head'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {

  const router = useRouter();

  if(router.isFallback){
    return <h1>Carregando...</h1>
  }

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR
    }
  ) 
  
  const countWords = post.data.content.reduce((acc, wordsC) => {
    acc += RichText.asText(wordsC.body).split(' ').length
    return acc
  }, 0)
  const readingTime = Math.ceil(countWords / 200)
  return (
    <>
      <Head>
        <title>{`${post.data.title} | spacetravelling `} </title>
      </Head>
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={commonStyles.container}>
        <div className={styles.content}>
          <div className={styles.postHeader}>
            <h1>{post.data.title}</h1>
            <ul>
              <li>
                <FiCalendar />
                <span>{formattedDate}</span>
              </li>
              <li>
                <FiUser />
                <span>{post.data.author}</span>
              </li>
              <li>
                <FiClock />
                <span>{readingTime} min</span>
              </li>
            </ul>
          </div>

          {post.data.content.map(content => (
            <article key={content.heading}>
              <h2>{content.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body)}} />
            </article>
          ))}
        </div>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ]);
  const paths = posts.results.map(post => (
    {
      params: {
        slug: post.uid
      }
    }
  ))

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body]
        }
      })
    }
  }

  return {
    props: {
      post
    }
  }
};
