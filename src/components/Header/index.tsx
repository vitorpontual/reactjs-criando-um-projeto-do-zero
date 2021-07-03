import Link from 'next/link'

import styles from './header.module.scss'

export default function Header() {
  return(
    <header className={`${styles.container}`}>
      <Link href='/'>
        <a className={`${styles.content}`}>
          <img src="/images/Logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  )
}
