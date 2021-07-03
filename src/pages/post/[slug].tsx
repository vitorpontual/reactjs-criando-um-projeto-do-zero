import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import Head from 'next/head'
import Link from 'next/link'


import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PreviewButton from '../../components/PreviewBtn';
import Comments from '../../components/Comments';
import Header from '../../components/Header'


interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      }
    }[],
    nextPost: {
      uid: string;
      data: {
        title: string;
      }
    }[],
  };
}

export default function Post({ post, navigation, preview }: PostProps): JSX.Element {

  const router = useRouter();

  if (router.isFallback) {
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
    const heading = wordsC.heading.split(' ').length
    acc += heading
    acc += RichText.asText(wordsC.body).split(' ').length
    return acc
  }, 0)

  const readingTime = Math.ceil(countWords / 200)

  const isPostEdited = post.first_publication_date !== post.last_publication_date

  let editionDate;
  if(isPostEdited) {
    editionDate = format(
      new Date(post.last_publication_date),
      "'* editado em' dd MMM yyyy', às' H':'mm",
      {
        locale: ptBR
      }
    )
  }
  return (
    <>
      <Head>
        <title>{`${post.data.title} | spacetravelling `} </title>
      </Head>
      <Header />
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
            {isPostEdited && <span>{editionDate}</span>}
          </div>

          {post.data.content.map(content => (
            <article key={content.heading}>
              <h2>{content.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }} />
            </article>
          ))}
        </div>

        <section className={`${styles.navigation} ${commonStyles.container}`}>
          {navigation?.prevPost.length > 0 && (
            <div>
              <h3>{navigation.prevPost[0].data.title}</h3>
              <Link href={`/post/${navigation.prevPost[0].uid}`}>Voltar post</Link>
            </div>
          )}
          {navigation?.nextPost.length > 0 && (
            <div className={!navigation?.prevPost[0]?.data.title ? styles.positionNav : ''} >
              <h3>{navigation.nextPost[0].data.title}</h3>
              <Link href={`/post/${navigation.nextPost[0].uid}`}>Próximo post</Link>
            </div>
          )}

        </section>

        <Comments />
        {preview && (
          <PreviewButton />
        )}
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

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null
  });

  const prevPost = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]'
    }
  )

  const nextPost = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]'
    }
  )




  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
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
      post,
      preview,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results
      }
    }
  }
};
