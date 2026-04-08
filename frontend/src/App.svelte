<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';

  type UrlRecord = {
    id: number;
    originalUrl: string;
    shortCode: string;
    createdAt: string;
    updatedAt: string;
    accessCount: number;
  };

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
  const STORAGE_KEY = 'azza_links_created_links';

  let urlInput = '';
  let loading = false;
  let formError = '';
  let formSuccess = '';

  let links: UrlRecord[] = [];
  let expandedCode: string | null = null;

  let statsByCode: Record<string, UrlRecord> = {};
  let statsLoadingByCode: Record<string, boolean> = {};
  let statsErrorByCode: Record<string, string> = {};

  let editingCode: string | null = null;
  let editingUrl: string = '';
  let editingLoading: Record<string, boolean> = {};
  let editingError: Record<string, string> = {};
  let deletingLoading: Record<string, boolean> = {};

  const formatDate = (dateRaw: string): string => {
    const date = new Date(dateRaw);
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const ensureHttpProtocol = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  };

  const shortLinkFromCode = (code: string): string => {
    return `${API_BASE}/shorten/${code}`;
  };

  const saveLinks = (): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  };

  const loadLinks = (): void => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as UrlRecord[];
      links = parsed;
    } catch {
      links = [];
    }
  };

  const createShortLink = async (): Promise<void> => {
    formError = '';
    formSuccess = '';

    const normalizedUrl = ensureHttpProtocol(urlInput);
    if (!normalizedUrl) {
      formError = 'Ingresa una URL valida.';
      return;
    }

    loading = true;

    try {
      const response = await fetch(`${API_BASE}/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const payload = (await response.json()) as UrlRecord | { error: string };

      if (!response.ok || 'error' in payload) {
        formError = 'error' in payload ? payload.error : 'No se pudo crear el enlace.';
        return;
      }

      links = [payload, ...links.filter((entry) => entry.shortCode !== payload.shortCode)];
      saveLinks();
      statsByCode[payload.shortCode] = payload;
      formSuccess = 'Link corto creado correctamente.';
      urlInput = '';
    } catch {
      formError = 'No hay conexion con la API backend.';
    } finally {
      loading = false;
    }
  };

  const fetchStats = async (shortCode: string): Promise<void> => {
    statsLoadingByCode[shortCode] = true;
    statsErrorByCode[shortCode] = '';

    try {
      const response = await fetch(`${API_BASE}/shorten/${shortCode}/stats`);
      const payload = (await response.json()) as UrlRecord | { error: string };

      if (!response.ok || 'error' in payload) {
        statsErrorByCode[shortCode] =
          'error' in payload ? payload.error : 'No fue posible cargar estadisticas.';
        return;
      }

      statsByCode[shortCode] = payload;
      links = links.map((item) => (item.shortCode === shortCode ? payload : item));
      saveLinks();
    } catch {
      statsErrorByCode[shortCode] = 'Error al consultar estadisticas.';
    } finally {
      statsLoadingByCode[shortCode] = false;
    }
  };

  const toggleExpanded = async (shortCode: string): Promise<void> => {
    expandedCode = expandedCode === shortCode ? null : shortCode;

    if (expandedCode === shortCode) {
      await fetchStats(shortCode);
    }
  };

  const copyShortLink = async (shortCode: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shortLinkFromCode(shortCode));
      formSuccess = 'Link copiado al portapapeles.';
    } catch {
      formError = 'No se pudo copiar el link.';
    }
  };

  const startEdit = (link: UrlRecord): void => {
    editingCode = link.shortCode;
    editingUrl = link.originalUrl;
    editingError[link.shortCode] = '';
  };

  const cancelEdit = (): void => {
    editingCode = null;
    editingUrl = '';
  };

  const updateUrl = async (): Promise<void> => {
    if (!editingCode) return;

    const normalizedUrl = ensureHttpProtocol(editingUrl);
    if (!normalizedUrl) {
      editingError[editingCode] = 'Ingresa una URL valida.';
      return;
    }

    editingLoading[editingCode] = true;
    editingError[editingCode] = '';

    try {
      const response = await fetch(`${API_BASE}/shorten/${editingCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newUrl: normalizedUrl }),
      });

      const payload = (await response.json()) as UrlRecord | { error: string };

      if (!response.ok || 'error' in payload) {
        editingError[editingCode] = 'error' in payload ? payload.error : 'No se pudo actualizar.';
        return;
      }

      links = links.map((link) => (link.shortCode === editingCode ? payload : link));
      statsByCode[editingCode] = payload;
      saveLinks();
      formSuccess = 'Link actualizado correctamente.';
      editingCode = null;
      editingUrl = '';
    } catch {
      editingError[editingCode] = 'Error al actualizar el link.';
    } finally {
      editingLoading[editingCode] = false;
    }
  };

  const deleteUrl = async (shortCode: string): Promise<void> => {
    if (!confirm('¿Estás seguro de que deseas eliminar este link?')) return;

    deletingLoading[shortCode] = true;

    try {
      const response = await fetch(`${API_BASE}/shorten/${shortCode}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error: string };
        formError = errorPayload.error || 'No se pudo eliminar el link.';
        return;
      }

      links = links.filter((link) => link.shortCode !== shortCode);
      delete statsByCode[shortCode];
      delete statsLoadingByCode[shortCode];
      delete statsErrorByCode[shortCode];
      saveLinks();
      formSuccess = 'Link eliminado correctamente.';
    } catch {
      formError = 'Error al eliminar el link.';
    } finally {
      deletingLoading[shortCode] = false;
    }
  };

  const handleSubmit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    await createShortLink();
  };

  onMount(async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/shorten`);
      if (response.ok) {
        const data = (await response.json()) as UrlRecord[];
        links = data;
        saveLinks();
      } else {
        loadLinks();
      }
    } catch {
      loadLinks();
    }
  });
</script>

<main class="layout">
  <section class="hero">
    <p class="badge">azza_links</p>
    <h1>Acortador de links</h1>
    <p class="subtitle">
      Crea enlaces cortos y revisa sus estadisticas en una lista expansiva.
    </p>
  </section>

  <section class="panel">
    <form on:submit={handleSubmit} class="creator">
      <label for="url">Link original</label>
      <div class="inputRow">
        <input
          id="url"
          type="url"
          bind:value={urlInput}
          placeholder="https://tu-link-super-largo.com/recurso"
          required
        />
        <button type="submit" disabled={loading}>
          {#if loading}Creando...{:else}Acortar{/if}
        </button>
      </div>
      {#if formError}
        <p class="feedback error">{formError}</p>
      {/if}
      {#if formSuccess}
        <p class="feedback success">{formSuccess}</p>
      {/if}
    </form>
  </section>

  <section class="panel listPanel">
    <div class="listHeader">
      <h2>Links creados</h2>
      <span>{links.length} total</span>
    </div>

    {#if links.length === 0}
      <p class="emptyState">Todavia no has creado links en esta interfaz.</p>
    {:else}
      <ul class="linksList">
        {#each links as link (link.shortCode)}
          <li class="linkItem">
            <button
              type="button"
              class="itemTop"
              on:click={() => toggleExpanded(link.shortCode)}
              aria-expanded={expandedCode === link.shortCode}
            >
              <div class="itemText">
                <p class="shortLink">{shortLinkFromCode(link.shortCode)}</p>
                <p class="originalLink" title={link.originalUrl}>{link.originalUrl}</p>
              </div>
              <span class:rotated={expandedCode === link.shortCode} class="chevron">▾</span>
            </button>

            {#if expandedCode === link.shortCode}
              <div class="itemDetails" transition:slide>
                <div class="actions">
                  <a href={shortLinkFromCode(link.shortCode)} target="_blank" rel="noreferrer">
                    Abrir link corto
                  </a>
                  <button type="button" on:click={() => copyShortLink(link.shortCode)}>
                    Copiar
                  </button>
                  <button
                    type="button"
                    class="secondary"
                    on:click={() => startEdit(link)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="danger"
                    on:click={() => deleteUrl(link.shortCode)}
                    disabled={deletingLoading[link.shortCode]}
                  >
                    {#if deletingLoading[link.shortCode]}Eliminando...{:else}Eliminar{/if}
                  </button>
                </div>

                {#if editingCode === link.shortCode}
                  <div class="editPanel">
                    <label for="edit-url-{link.shortCode}">Actualizar URL</label>
                    <div class="inputRow">
                      <input
                        id="edit-url-{link.shortCode}"
                        type="url"
                        bind:value={editingUrl}
                        placeholder="https://nueva-url.com"
                      />
                      <button
                        type="button"
                        on:click={() => updateUrl()}
                        disabled={editingLoading[link.shortCode]}
                      >
                        {#if editingLoading[link.shortCode]}Guardando...{:else}Guardar{/if}
                      </button>
                    </div>
                    {#if editingError[link.shortCode]}
                      <p class="miniMessage error">{editingError[link.shortCode]}</p>
                    {/if}
                    <button type="button" class="secondary small" on:click={cancelEdit}>
                      Cancelar
                    </button>
                  </div>
                {:else if statsLoadingByCode[link.shortCode]}
                  <p class="miniMessage">Cargando estadisticas...</p>
                {:else if statsErrorByCode[link.shortCode]}
                  <p class="miniMessage error">{statsErrorByCode[link.shortCode]}</p>
                {:else}
                  {@const stats = statsByCode[link.shortCode] ?? link}
                  <div class="statsGrid">
                    <article>
                      <h3>Codigo</h3>
                      <p>{stats.shortCode}</p>
                    </article>
                    <article>
                      <h3>Visitas</h3>
                      <p>{stats.accessCount}</p>
                    </article>
                    <article>
                      <h3>Creado</h3>
                      <p>{formatDate(stats.createdAt)}</p>
                    </article>
                    <article>
                      <h3>Actualizado</h3>
                      <p>{formatDate(stats.updatedAt)}</p>
                    </article>
                  </div>
                {/if}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
