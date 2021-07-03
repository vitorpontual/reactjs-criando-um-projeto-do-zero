import Link from 'next/link'
import styles from './previewbtn.module.scss'

export default function PreviewButton(){
  return(
    <aside className={styles.preview}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
    </aside>
  )
}