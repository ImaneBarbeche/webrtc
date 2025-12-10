import React, { useMemo, useState } from "react";

// Fonction de détection des gaps (adaptée du JS)
function detectGaps(episodes) {
  const gaps = [];
  const groupedEpisodes = {};

  episodes.forEach((episode) => {
    const groupId = episode.group;
    if (!groupedEpisodes[groupId]) groupedEpisodes[groupId] = [];
    groupedEpisodes[groupId].push(episode);
  });

  for (const groupId in groupedEpisodes) {
    const groupEpisodes = groupedEpisodes[groupId];
    groupEpisodes.sort((a, b) => a.start - b.start);
    for (let i = 1; i < groupEpisodes.length; i++) {
      const actuel = groupEpisodes[i];
      const precedent = groupEpisodes[i - 1];
      if (actuel.start > precedent.end) {
        gaps.push({
          start: precedent.end,
          end: actuel.start,
          duration: actuel.start - precedent.end,
          group: groupId,
        });
      }
    }
  }
  return gaps;
}

export default function GapListModal({ episodes }) {
  const [open, setOpen] = useState(false);

  // Calcule les gaps à partir des épisodes reçus
  const gaps = useMemo(() => detectGaps(episodes), [episodes]);
  const gapCount = gaps.length;

  return (
    <div>
      <button
        style={{ margin: "1em" }}
        onClick={() => setOpen(true)}
        id="gap-counter-btn"
      >
        Périodes manquantes : {gapCount}
      </button>
      {open && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            minWidth: 320,
            maxWidth: "90vw",
            maxHeight: "60vh",
            overflowY: "auto",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#fff",
            padding: "1.2em 1.5em 1em 1.5em",
          }}
        >
          <button
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              background: "#eee",
              border: "none",
              padding: "0.3em 0.8em",
              borderRadius: 4,
              cursor: "pointer",
            }}
            onClick={() => setOpen(false)}
          >
            Fermer
          </button>
          <h3>Périodes manquantes</h3>
          {gaps.length === 0 ? (
            <div>Aucune période manquante détectée !</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {gaps.map((gap, idx) => (
                <li key={idx}>
                  Groupe : {gap.group} | {new Date(gap.start).getFullYear()} →{" "}
                  {new Date(gap.end).getFullYear()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}