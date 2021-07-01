import Link from 'next/link'

import styles from './header.module.scss'
import commonStyles from '../../styles/common.module.scss'

export default function Header() {
  return(
    <header className={commonStyles.container}>
      <Link href='/'>
        <a className={styles.content}>
          <img src="/images/Logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  )
}
