import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          AirConsole Klonu
        </div>
        <div className={styles.navCtas}>
          <a className={styles.linkBtn} href="/kumanda">Kumandayı Aç</a>
          <a className={`${styles.linkBtn} ${styles.linkPrimary}`} href="/ekran">Ekranı Aç</a>
        </div>
      </nav>

      <section className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Telefonunu kumandaya çevir, TV'de birlikte oyna.</h1>
          <p className={styles.heroSubtitle}>Herhangi bir TV tarayıcısından bağlan, arkadaşların telefonlarını saniyeler içinde kumandaya dönüştür.</p>
          <div className={styles.heroCtas}>
            <a className={`${styles.linkBtn} ${styles.linkPrimary}`} href="/ekran">TV'de Başlat</a>
            <a className={styles.linkBtn} href="/kumanda">Telefonda Katıl</a>
          </div>
        </div>
        <div className={styles.mockupWrap}>
          <div className={styles.tv}>
            <div className={styles.tvBezel} />
            <div className={styles.tvGrid} />
          </div>
          <div className={styles.phones}>
            <div className={styles.phone}>
              <div className={styles.phoneNotch} />
              <div className={styles.phonePad}>A</div>
            </div>
            <div className={styles.phone}>
              <div className={styles.phoneNotch} />
              <div className={styles.phonePad}>⬆️⬇️</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureTitle}>Anında Oda Kodu</div>
          <div className={styles.featureText}>TV ekranında oda kodu üret, herkes telefondan katılsın.</div>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureTitle}>Gerçek Zamanlı</div>
          <div className={styles.featureText}>Socket.IO ile düşük gecikme, akıcı kontrol deneyimi.</div>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureTitle}>Kurulum Yok</div>
          <div className={styles.featureText}>Uygulama indirmeden, tarayıcıdan tek tıkla oyna.</div>
        </div>
      </section>

      <section className={styles.gallery}>
        <div className={styles.galleryGrid}>
          {["Top Oyunu", "Yarış", "Quiz", "Pong+"].map((title, i) => (
            <div className={styles.card} key={i}>
              <div className={styles.cardImage} />
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{title}</div>
                <div className={styles.cardText}>Çok oyunculu eğlence, telefonla kontrol.</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.markets}>
        <div className={styles.marketRow}>
          <a className={styles.marketBadge} href="#"> 
            <span className={styles.marketIcon} /> App Store'dan İndir
          </a>
          <a className={`${styles.marketBadge} ${styles.marketBadgeLight}`} href="#">
            <span className={styles.marketIcon} /> Google Play'den Alın
          </a>
          <a className={`${styles.marketBadge} ${styles.marketBadgeLight}`} href="#">
            <span className={styles.marketIcon} /> Amazon Appstore
          </a>
          <a className={`${styles.marketBadge} ${styles.marketBadgeLight}`} href="#">
            <span className={styles.marketIcon} /> Samsung Galaxy Store
          </a>
        </div>
      </section>

      <section className={styles.steps}>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            TV'de <b>Ekranı Aç</b>'ı seç.
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            Telefonda <b>Kumanda</b>'yı aç ve kodu gir.
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            Birlikte oyna!
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>© {new Date().getFullYear()} AirConsole Klonu</div>
        <div className={styles.footerLinks}>
          <a href="/ekran">Ekran</a>
          <a href="/kumanda">Kumanda</a>
          <a href="https://www.airconsole.com/" target="_blank" rel="noreferrer">AirConsole</a>
        </div>
      </footer>
    </div>
  );
}
