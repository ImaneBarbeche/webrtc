// timelineStorage.js
// Utilitaires pour la persistance des items, groupes et options de la timeline dans localStorage

export function restoreItems(items) {
  const savedItems = localStorage.getItem("lifestories_items");
  if (savedItems) {
    try {
      const parsedItems = JSON.parse(savedItems);
      items.clear();
      items.add(parsedItems);
    } catch (e) {
      console.error("❌ Erreur lors du chargement des items:", e);
    }
  }
}

export function restoreGroups(groups) {
  const savedGroups = localStorage.getItem("lifestories_groups");
  if (savedGroups) {
    try {
      const parsedGroups = JSON.parse(savedGroups);
      parsedGroups.forEach((savedGroup) => {
        const existingGroup = groups.get(savedGroup.id);
        if (existingGroup) {
          groups.update({
            id: savedGroup.id,
            showNested: savedGroup.showNested,
            landmark: savedGroup.landmark,
          });
        }
      });
    } catch (e) {
      console.error("❌ Erreur lors du chargement des groupes:", e);
    }
  }
}

export function restoreOptions(options) {
  const savedOptions = localStorage.getItem("lifestories_options");
  if (savedOptions) {
    try {
      const parsedOptions = JSON.parse(savedOptions);
      if (parsedOptions.min) options.min = new Date(parsedOptions.min);
      if (parsedOptions.max) options.max = new Date(parsedOptions.max);
      if (parsedOptions.start) {
        const startDate = new Date(parsedOptions.start);
        if (!isNaN(startDate.getTime())) {
          if (!options.min || options.min.getTime() > startDate.getTime()) {
            options.min = new Date(startDate.getFullYear(), 0, 1);
          }
          options.start = startDate;
        }
      }
      if (parsedOptions.end) {
        const endDate = new Date(parsedOptions.end);
        if (!isNaN(endDate.getTime())) {
          if (!options.max || options.max.getTime() < endDate.getTime()) {
            options.max = new Date(endDate.getFullYear() + 1, 11, 31);
          }
          options.end = endDate;
        }
      }
    } catch (e) {
      console.error("❌ Erreur lors du chargement des options:", e);
    }
  }
}

export function persistItems(items) {
  try {
    const all = items.get();
    localStorage.setItem("lifestories_items", JSON.stringify(all));
  } catch (e) {
    console.warn("[LifeStories] persistItems failed", e);
  }
}

export function persistGroups(groups) {
  try {
    localStorage.setItem("lifestories_groups", JSON.stringify(groups.get()));
  } catch (e) {
    console.warn("[LifeStories] persistGroups failed", e);
  }
}

export function persistOptions(timeline) {
  try {
    const currentOptions = {
      min: timeline.options.min,
      max: timeline.options.max,
      start: timeline.options.start,
      end: timeline.options.end,
    };
    localStorage.setItem("lifestories_options", JSON.stringify(currentOptions));
  } catch (e) {
    console.warn("[LifeStories] persistOptions failed", e);
  }
}
