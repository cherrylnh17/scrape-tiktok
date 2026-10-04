/**
 * Script browser console untuk mencegat response API komentar TikTok
 * dan mengumpulkan komentar beserta balasannya secara otomatis di DevTools.
 */
export const CONSOLE_SCRIPT = String.raw`(() => {
  const semua = [], lihat = new Set();
  const simpan = (txt) => {
    try {
      const d = JSON.parse(txt);
      (d.comments || []).forEach(c => {
        if (!lihat.has(c.cid)) { lihat.add(c.cid); semua.push(c); }
      });
    } catch (e) {}
  };
  const cocok = (u) => /comment\/(reply\/)?list/.test(u);

  // cegat fetch
  const f0 = window.fetch;
  window.fetch = async (...a) => {
    const r = await f0(...a);
    const u = typeof a[0] === "string" ? a[0] : a[0].url;
    if (cocok(u)) r.clone().text().then(simpan);
    return r;
  };
  // cegat XHR
  const o0 = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u, ...r) {
    if (cocok(u)) this.addEventListener("load", () => simpan(this.responseText));
    return o0.call(this, m, u, ...r);
  };

  const cariScroll = () => {
    let el = document.querySelector('[data-e2e="comment-level-1"]');
    while (el && el.scrollHeight <= el.clientHeight + 5) el = el.parentElement;
    return el;
  };

  window.__tt = {
    semua,
    status: () => console.log("Terkumpul:", semua.length),
    async otoScroll(maks = 300, jeda = 1500) {
      let sama = 0, terakhir = 0;
      for (let i = 0; i < maks && sama < 5; i++) {
        const box = cariScroll();
        if (box) box.scrollTop = box.scrollHeight;
        // klik tombol balasan (teks bisa beda sesuai bahasa akun)
        document.querySelectorAll('[data-e2e^="view-more"], [data-e2e*="reply"]').forEach(b => {
          if (/lihat|view|balasan|repl/i.test(b.textContent) && b.textContent.length < 40) b.click();
        });
        await new Promise(r => setTimeout(r, jeda));
        sama = semua.length === terakhir ? sama + 1 : 0;
        terakhir = semua.length;
        console.log("Terkumpul:", semua.length);
      }
      console.log("Selesai. Jalankan __tt.unduh()");
    },
    unduh() {
      const blob = new Blob([JSON.stringify({ comments: semua })], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "komentar_tiktok.json";
      a.click();
    },
  };
  console.log("Siap. Buka komentar dan scroll, atau jalankan __tt.otoScroll()");
})();`;
