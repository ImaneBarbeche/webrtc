// timelineConfig.js
import { getBirthYear } from "./birthYear.js";
import {
  onAdd,
  onMove,
  onMoving,
  onUpdate,
  onRemove,
  snap,
  groupTemplate,
} from "./timelineEvents.js";
import { stepSize } from "./timeline.js";
import { timelineState } from "./timelineState.js"; // objet centralisé pour isCustomBarMoving, isEditingEpisode

export const options = {
  editable: true,
  zoomMin: 1000 * 60 * 60 * 24 * 365 * 1,
  zoomMax: 1000 * 60 * 60 * 24 * 365 * 50,
  min: new Date(),
  max: new Date(`${new Date().getFullYear() + 5}-12-31`),
  showCurrentTime: false,
  orientation: "top",
  margin: { item: { vertical: 30, horizontal: 0 } },
  align: "center",
  stack: true,
  end: new Date(`${new Date().getFullYear()}-12-31`),
  verticalScroll: true,
  height: "80vh",
  zoomable: true,
  zoomFriction: 40,
  showMinorLabels: true,
  showMajorLabels: true,
  xss: {
    filterOptions: {
      allowList: {
        span: ["class"],
        p: ["class"],
        b: [],
        br: [],
        div: ["class", "title"],
        img: ["src", "alt", "class", "width", "height"],
      },
    },
  },
  format: {
    minorLabels: function (date, scale) {
      switch (scale) {
        case "millisecond": return vis.moment(date).format("SSS");
        case "second": return vis.moment(date).format("s");
        case "minute": return vis.moment(date).format("HH:mm");
        case "hour": return vis.moment(date).format("HH:mm");
        case "weekday": return vis.moment(date).format("ddd D");
        case "day": return vis.moment(date).format("D");
        case "week": return vis.moment(date).format("w");
        case "month": return vis.moment(date).format("MMM");
        case "year":
          const year = new Date(date).getFullYear();
          const birthYear = getBirthYear();
          const age = birthYear ? year - birthYear : "";
          return `<div style="display:flex;flex-direction:column;align-items:center;">
                    <b>${year}</b>
                    <span style="font-size:12px;color:#888;">${age !== "" ? age + " ans" : ""}</span>
                  </div>`;
        default: return "";
      }
    },
  },
  template: function (item) {
    if (!item) return "";
    if (item.type === "box" && item.category === "degree") {
      return `<img src="./assets/icon/degree.svg" alt="${item.content}" />`;
    }
    return item.content;
  },
  // Brancher les callbacks importés
  onAdd: (item, cb) => onAdd(item, cb, timelineState.isEditingEpisode),
  onMove,
  onMoving,
  onUpdate,
  onRemove,
  snap: (date, scale) => snap(date, scale, stepSize, timelineState.isCustomBarMoving),
  groupTemplate,
};
