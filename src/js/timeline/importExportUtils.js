// Import/export logic for timeline data
export async function exportTimelineData(items) {
  try {
    var data = items.get({
      type: {
        start: "ISODate",
        end: "ISODate",
      },
    });
    let jsonString = JSON.stringify(data, null, 2);
    const filename = `timeline-data-${new Date().toISOString().slice(0, 10)}.json`;
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform;
    if (isNative) {
      let Filesystem, Directory;
      if (!window.Filesystem || !window.Directory) {
        const cap = await import('@capacitor/filesystem');
        Filesystem = cap.Filesystem;
        Directory = cap.Directory;
        window.Filesystem = Filesystem;
        window.Directory = Directory;
      } else {
        Filesystem = window.Filesystem;
        Directory = window.Directory;
      }
      const result = await Filesystem.writeFile({
        path: filename,
        data: jsonString,
        directory: Directory.Documents,
        encoding: 'utf8'
      });
      alert(`Fichier sauvegardé avec succès dans Documents : ${filename}`);
    } else {
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      alert(`Fichier téléchargé : ${filename}`);
    }
  } catch (error) {
    console.error("Erreur d'export:", error);
    alert(`Erreur lors de l'export: ${error.message}`);
  }
}

export function importTimelineData(items, test_items, utils) {
  try {
    const prepared = [];
    test_items.forEach((i) => {
      try {
        if (items.get(i.id)) {
          const newId = `${i.id}_${Date.now()}`;
          prepared.push(Object.assign({}, i, { id: newId }));
        } else {
          prepared.push(i);
        }
      } catch (e) {
        console.warn("[LifeStories] failed to prepare test item", e, i);
        prepared.push(i);
      }
    });
    items.add(prepared);
    utils.prettyAlert("Load", "Items ajoutés localement", "success", 1200);
    // Optionally broadcast via WebRTC
    if (
      window.webrtcSync &&
      typeof window.webrtcSync.sendMessage === "function" &&
      window.webrtcSync.isActive && window.webrtcSync.isActive()
    ) {
      window.webrtcSync.sendMessage({
        type: "LOAD_ITEMS",
        items: prepared,
      });
      utils.prettyAlert("Load", "Envoi des items au pair", "info", 1200);
    }
  } catch (error) {
    console.error("Erreur d'import:", error);
    alert(`Erreur lors de l'import: ${error.message}`);
  }
}
