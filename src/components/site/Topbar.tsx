import styles from './Topbar.module.css';

export function Topbar({ text }: { text: string }) {
  if (!text) return null;
  return <div className={styles.topbar}>{text}</div>;
}
