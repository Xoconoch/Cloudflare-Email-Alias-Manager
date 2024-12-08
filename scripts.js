document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");
  const createAliasBtn = document.getElementById("create-alias-btn");
  const viewAliasesBtn = document.getElementById("view-aliases-btn");
  const configBtn = document.getElementById("config-btn");

  createAliasBtn.addEventListener("click", () => {
    loadCreateAliasForm();
  });

  viewAliasesBtn.addEventListener("click", () => {
    loadViewAliases();
  });

  configBtn.addEventListener("click", () => {
    loadConfigForm();
  });

  loadCreateAliasForm();

  async function loadConfigForm() {
    const apiKey = await getApiKey();
    const zoneId = await getZoneId();

    content.innerHTML = `
      <h2>Configuration</h2>
      <form id="config-form">
        <label for="api-key">API Key:</label>
        <input type="text" id="api-key" value="${apiKey}" required>
        <label for="zone-id">Zone ID:</label>
        <input type="text" id="zone-id" value="${zoneId}" required>
        <button type="submit">Save</button>
      </form>
      <p id="config-message" style="color: green; display: none;">Configuration updated succesfully.</p>
    `;

    const form = document.getElementById("config-form");
    const configMessage = document.getElementById("config-message");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newApiKey = document.getElementById("api-key").value;
      const newZoneId = document.getElementById("zone-id").value;

      chrome.storage.local.set({ apiKey: newApiKey, zoneId: newZoneId }, () => {
        configMessage.style.display = "block";
        setTimeout(() => {
          configMessage.style.display = "none";
        }, 3000);
      });
    });
  }

  async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["apiKey"], (result) => {
        resolve(result.apiKey || "");
      });
    });
  }

  async function getZoneId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["zoneId"], (result) => {
        resolve(result.zoneId || "");
      });
    });
  }

  async function loadCreateAliasForm() {
    content.innerHTML = `
      <h2>Create Alias</h2>
      <form id="create-alias-form">
        <label for="alias-name">Alias:</label>
        <input type="text" id="alias-name" required>
        <label for="destination-email">Destination:</label>
        <input type="email" id="destination-email" required>
        <button type="submit">Create</button>
      </form>
      <p id="creation-message" style="color: green; display: none;">Alias created succesfully.</p>
    `;

    const form = document.getElementById("create-alias-form");
    const creationMessage = document.getElementById("creation-message");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const aliasName = document.getElementById("alias-name").value;
      const destinationEmail = document.getElementById("destination-email").value;

      const apiKey = await getApiKey();
      const zoneId = await getZoneId();

      if (!apiKey || !zoneId) {
        console.error("API key o Zone ID no configuradas.");
        return;
      }

      try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            name: `Regla para ${aliasName}@cordovault.com`,
            enabled: true,
            priority: 0,
            matchers: [{
              field: "to",
              type: "literal",
              value: `${aliasName}@cordovault.com`
            }],
            actions: [{
              type: "forward",
              value: [destinationEmail]
            }]
          })
        });

        const result = await response.json();
        if (result.success) {
          creationMessage.style.display = "block";
          form.reset();
          setTimeout(() => {
            creationMessage.style.display = "none";
          }, 3000);
        } else {
          console.error("Errores:", result.errors);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    });
  }

  async function loadViewAliases() {
    const apiKey = await getApiKey();
    const zoneId = await getZoneId();

    if (!apiKey || !zoneId) {
      content.innerHTML = "<p>Error: API key o Zone ID no configuradas.</p>";
      return;
    }

    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        content.innerHTML = `<p>Error al cargar los alias: ${result.errors[0]?.message || "Desconocido"}</p>`;
        return;
      }

      const aliases = result.result;

      if (!aliases || aliases.length === 0) {
        content.innerHTML = `<p>No hay alias configurados actualmente.</p>`;
        return;
      }

      content.innerHTML = `
        <h2>Active Alias</h2>
        <table>
          <thead>
            <tr>
              <th>Alias</th>
              <th>Destination</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${aliases
              .map((alias) => {
                const aliasAddress = alias.matchers?.[0]?.value || "No disponible";
                const destination = alias.actions?.[0]?.value?.[0] || "No disponible";
                const isEnabled = alias.enabled;

                return `
                  <tr data-id="${alias.id}">
                    <td>${aliasAddress}</td>
                    <td><input type="text" class="destination-email" value="${destination}" /></td>
                    <td>
                      <label class="switch">
                        <input type="checkbox" class="alias-toggle" ${isEnabled ? "checked" : ""}>
                        <span class="slider"></span>
                      </label>
                    </td>
                    <td>
                      <button class="edit-alias">Save</button>
                      <button class="delete-alias">Delete</button>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      `;

      addAliasActions();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function addAliasActions() {
    document.querySelectorAll(".alias-toggle").forEach((toggle) => {
      toggle.addEventListener("change", async (e) => {
        const row = e.target.closest("tr");
        const aliasId = row.dataset.id;
        const isEnabled = e.target.checked;

        await updateAliasEnabledState(aliasId, isEnabled);
      });
    });

    document.querySelectorAll(".edit-alias").forEach((button) => {
      button.addEventListener("click", (e) => {
        const row = e.target.closest("tr");
        toggleConfirmButton(row, "edit");
      });
    });

    document.querySelectorAll(".delete-alias").forEach((button) => {
      button.addEventListener("click", (e) => {
        const row = e.target.closest("tr");
        toggleConfirmButton(row, "delete");
      });
    });
  }

  async function updateAliasEnabledState(aliasId, isEnabled) {
    const apiKey = await getApiKey();
    const zoneId = await getZoneId();

    if (!apiKey || !zoneId) {
      console.error("API key o Zone ID no configuradas.");
      return;
    }

    try {
      const getResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules/${aliasId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      const getResult = await getResponse.json();

      if (!getResult.success) {
        console.error("Error al obtener los datos del alias:", getResult.errors);
        return;
      }

      const aliasData = getResult.result;

      const updateResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules/${aliasId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          actions: aliasData.actions,
          matchers: aliasData.matchers,
          name: aliasData.name,
          priority: aliasData.priority,
          enabled: isEnabled
        })
      });

      const updateResult = await updateResponse.json();

      if (updateResult.success) {
        console.log(`Estado del alias actualizado exitosamente a ${isEnabled ? "habilitado" : "deshabilitado"}.`);
      } else {
        console.error("Error al actualizar el estado del alias:", updateResult.errors);
      }
    } catch (error) {
      console.error("Error al actualizar el estado del alias:", error);
    }
  }

  function toggleConfirmButton(row, action) {
    const actionButton = action === "edit" ? row.querySelector(".edit-alias") : row.querySelector(".delete-alias");
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Confirm";
    confirmButton.classList.add("confirm-alias");

    actionButton.replaceWith(confirmButton);

    confirmButton.addEventListener("click", async () => {
      if (action === "edit") {
        await editAlias(row);
      } else {
        await deleteAlias(row);
      }
      loadViewAliases();
    });
  }

  async function editAlias(row) {
    const apiKey = await getApiKey();
    const zoneId = await getZoneId();
    const ruleId = row.dataset.id;
    const newDestination = row.querySelector(".destination-email").value;
    const aliasAddress = row.querySelector("td:first-child").innerText;

    if (!apiKey || !zoneId) {
      console.error("API key o Zone ID no configuradas.");
      return;
    }

    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules/${ruleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          actions: [{ type: "forward", value: [newDestination] }],
          enabled: true,
          matchers: [{ field: "to", type: "literal", value: aliasAddress }],
          priority: 0,
          name: `Alias for ${aliasAddress}`
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log("Alias editado exitosamente.");
      } else {
        console.error("Error al editar el alias:", result.errors);
      }
    } catch (error) {
      console.error("Error al editar el alias:", error);
    }
  }

  async function deleteAlias(row) {
    const apiKey = await getApiKey();
    const zoneId = await getZoneId();
    const ruleId = row.dataset.id;

    if (!apiKey || !zoneId) {
      console.error("API key o Zone ID no configuradas.");
      return;
    }

    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules/${ruleId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      const result = await response.json();

      if (result.success) {
        console.log("Alias eliminado exitosamente.");
      } else {
        console.error("Error al eliminar el alias:", result.errors);
      }
    } catch (error) {
      console.error("Error al eliminar el alias:", error);
    }
  }
});

