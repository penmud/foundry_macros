// LocalStorage key for persisting client screen position
const POS_KEY = "icrpg-hud-position";
const savedPos = JSON.parse(localStorage.getItem(POS_KEY) || '{"top": 70, "left": null, "right": 20}');

// Check if the overlay already exists
const existingOverlay = document.getElementById("icrpg-target-hud");

// Prompt dialog to set or update the Normal DC
new Dialog({
  title: "Set Scene Difficulty",
  content: `
    <form style="margin-bottom: 10px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
        <label for="target-dc" style="font-weight: bold;">Normal DC:</label>
        <input id="target-dc" type="number" value="${canvas.scene?.getFlag("world", "icrpgTarget") || 12}" style="width: 80px; text-align: center;" autofocus />
      </div>
    </form>
  `,
  buttons: {
    set: {
      icon: '<i class="fas fa-bullseye"></i>',
      label: "Display / Update",
      callback: async (html) => {
        const baseDC = parseInt(html.find("#target-dc").val(), 10);
        if (isNaN(baseDC)) return ui.notifications.warn("Please enter a valid number.");

        if (canvas.scene) {
          await canvas.scene.setFlag("world", "icrpgTarget", baseDC);
        }

        const easyDC = baseDC - 3;
        const hardDC = baseDC + 3;

        // If overlay exists, preserve its current runtime position
        if (existingOverlay) {
          const rect = existingOverlay.getBoundingClientRect();
          savedPos.top = rect.top;
          savedPos.left = rect.left;
          savedPos.right = null;
          existingOverlay.remove();
        }

        // Determine inline position styles
        const posStyle = savedPos.left !== null 
          ? `top: ${savedPos.top}px; left: ${savedPos.left}px;`
          : `top: ${savedPos.top}px; right: ${savedPos.right}px;`;

        const hudHtml = `
          <div id="icrpg-target-hud" style="
            position: fixed;
            ${posStyle}
            z-index: 60;
            cursor: grab;
            user-select: none;
            background: rgba(18, 18, 22, 0.88);
            border: 2px solid #b5985a;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.6);
            padding: 10px 16px;
            color: #f0f0f0;
            font-family: var(--font-primary, sans-serif);
            text-align: center;
            min-width: 150px;
          ">
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #a0a0a0; margin-bottom: 2px; pointer-events: none;">
              Normal
            </div>
            <div style="font-size: 2.2rem; font-weight: 800; line-height: 1; color: #e6b443; text-shadow: 0 0 10px rgba(230, 180, 67, 0.4); pointer-events: none;">
              DC ${baseDC}
            </div>
            <div style="
              display: flex;
              justify-content: space-between;
              margin-top: 8px;
              padding-top: 6px;
              border-top: 1px solid rgba(255,255,255,0.15);
              gap: 16px;
              pointer-events: none;
            ">
              <div style="display: flex; flex-direction: column; align-items: center;">
                <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: #a0a0a0; margin-bottom: 2px;">Easy</span>
                <span style="color: #68d391; font-size: 0.95rem; font-weight: 700;">DC ${easyDC}</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center;">
                <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: #a0a0a0; margin-bottom: 2px;">Hard</span>
                <span style="color: #fc8181; font-size: 0.95rem; font-weight: 700;">DC ${hardDC}</span>
              </div>
            </div>
            <button id="close-icrpg-hud" style="
              background: none;
              border: none;
              color: #718096;
              font-size: 0.7rem;
              cursor: pointer;
              margin-top: 6px;
              padding: 0;
              text-decoration: underline;
            ">Hide</button>
          </div>
        `;

        document.body.insertAdjacentHTML("beforeend", hudHtml);

        const hud = document.getElementById("icrpg-target-hud");

        // Close button listener
        document.getElementById("close-icrpg-hud").addEventListener("click", (e) => {
          e.stopPropagation();
          hud.remove();
        });

        // Drag-and-drop repositioning logic
        let isDragging = false;
        let startX, startY, origLeft, origTop;

        hud.addEventListener("mousedown", (e) => {
          if (e.target.id === "close-icrpg-hud") return;
          isDragging = true;
          hud.style.cursor = "grabbing";

          const rect = hud.getBoundingClientRect();
          origLeft = rect.left;
          origTop = rect.top;
          startX = e.clientX;
          startY = e.clientY;

          const onMouseMove = (ev) => {
            if (!isDragging) return;
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;

            // Constrain within visible viewport
            const newLeft = Math.max(10, Math.min(window.innerWidth - rect.width - 10, origLeft + dx));
            const newTop = Math.max(10, Math.min(window.innerHeight - rect.height - 10, origTop + dy));

            hud.style.left = `${newLeft}px`;
            hud.style.top = `${newTop}px`;
            hud.style.right = "auto";
          };

          const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            hud.style.cursor = "grab";

            const finalRect = hud.getBoundingClientRect();
            localStorage.setItem(POS_KEY, JSON.stringify({
              top: finalRect.top,
              left: finalRect.left,
              right: null
            }));

            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
          };

          window.addEventListener("mousemove", onMouseMove);
          window.addEventListener("mouseup", onMouseUp);
        });
      }
    },
    remove: {
      icon: '<i class="fas fa-trash"></i>',
      label: "Remove HUD",
      callback: () => {
        const el = document.getElementById("icrpg-target-hud");
        if (el) el.remove();
      }
    }
  },
  default: "set"
}).render(true);
