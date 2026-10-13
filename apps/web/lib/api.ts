const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface User {
  id: str;
  email: str;
  full_name: str;
  avatar_url?: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  owner_id: string;
  role: string;
  created_at: string;
}

export interface PageTreeItem {
  id: string;
  parent_id?: string;
  title: string;
  icon?: string;
  is_favorite: boolean;
  is_archived: boolean;
  position: string;
  updated_at: string;
  children: PageTreeItem[];
}

export interface BlockItem {
  id: string;
  page_id: string;
  parent_id?: string;
  type: string;
  position: string;
  content: {
    text?: string;
    [key: string]: any;
  };
  properties: {
    checked?: boolean;
    language?: string;
    color?: string;
    collapsed?: boolean;
    [key: string]: any;
  };
  updated_at: string;
}

export interface PageDetail {
  id: string;
  workspace_id: string;
  parent_id?: string;
  title: string;
  icon?: string;
  cover_url?: string;
  is_favorite: boolean;
  is_archived: boolean;
  position: string;
  created_at: string;
  updated_at: string;
  blocks: BlockItem[];
}

export interface DatabaseProperty {
  id: string;
  database_id: string;
  name: string;
  type: string;
  position: string;
  config: any;
}

export interface DatabaseView {
  id: string;
  database_id: string;
  name: string;
  type: "table" | "board";
  filters: any[];
  sorts: any[];
  config: any;
}

export interface DatabaseRow {
  id: string;
  database_id: string;
  position: string;
  cells: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseDetail {
  id: string;
  workspace_id: string;
  page_id?: string;
  name: string;
  icon?: string;
  description?: string;
  properties: DatabaseProperty[];
  views: DatabaseView[];
  rows: DatabaseRow[];
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  icon?: string;
  url: string;
  highlights?: string;
  score: number;
}

export interface AIStatus {
  status: "connected" | "offline";
  provider: string;
  model: string;
  base_url: string;
  message?: string;
}

export interface AIChatResponse {
  message: string;
  suggested_actions: any[];
  sources: { title: string; url: string }[];
  model_used: string;
  is_fallback: boolean;
}

class APIClient {
  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nexus_token");
    }
    return null;
  }

  setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_token", token);
    }
  }

  clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexus_token");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<{ access_token: string; user: User }>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async register(email: string, password: string, full_name: string) {
    const res = await this.request<{ access_token: string; user: User; default_workspace_slug: string }>(`/auth/register`, {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>(`/auth/me`);
  }

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return this.request<Workspace[]>(`/workspaces`);
  }

  async createWorkspace(name: string, icon: string = "⚡"): Promise<Workspace> {
    return this.request<Workspace>(`/workspaces`, {
      method: "POST",
      body: JSON.stringify({ name, icon }),
    });
  }

  // Pages
  async getWorkspacePages(workspaceId: string): Promise<PageTreeItem[]> {
    return this.request<PageTreeItem[]>(`/pages/workspace/${workspaceId}`);
  }

  async getPage(pageId: string): Promise<PageDetail> {
    return this.request<PageDetail>(`/pages/${pageId}`);
  }

  async createPage(workspaceId: string, title: string = "Untitled", parentId?: string): Promise<PageDetail> {
    return this.request<PageDetail>(`/pages/workspace/${workspaceId}`, {
      method: "POST",
      body: JSON.stringify({ title, parent_id: parentId }),
    });
  }

  async updatePage(pageId: string, data: Partial<PageDetail>): Promise<PageDetail> {
    return this.request<PageDetail>(`/pages/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deletePage(pageId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/pages/${pageId}`, {
      method: "DELETE",
    });
  }

  // Blocks
  async createBlock(pageId: string, blockData: Partial<BlockItem>, prevPos?: string, nextPos?: string): Promise<BlockItem> {
    const params = new URLSearchParams();
    if (prevPos) params.append("prev_pos", prevPos);
    if (nextPos) params.append("next_pos", nextPos);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<BlockItem>(`/blocks/page/${pageId}${query}`, {
      method: "POST",
      body: JSON.stringify(blockData),
    });
  }

  async updateBlock(blockId: string, data: Partial<BlockItem>): Promise<BlockItem> {
    return this.request<BlockItem>(`/blocks/${blockId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteBlock(blockId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/blocks/${blockId}`, {
      method: "DELETE",
    });
  }

  async syncBlocks(pageId: string, blocks: BlockItem[]): Promise<any> {
    return this.request<any>(`/blocks/page/${pageId}/batch-sync`, {
      method: "POST",
      body: JSON.stringify(blocks),
    });
  }

  // Databases
  async getDatabases(workspaceId: string): Promise<DatabaseDetail[]> {
    return this.request<DatabaseDetail[]>(`/databases/workspace/${workspaceId}`);
  }

  async getDatabase(databaseId: string): Promise<DatabaseDetail> {
    return this.request<DatabaseDetail>(`/databases/${databaseId}`);
  }

  async createDatabase(workspaceId: string, name: string = "Untitled Database"): Promise<DatabaseDetail> {
    return this.request<DatabaseDetail>(`/databases/workspace/${workspaceId}`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async addDatabaseProperty(databaseId: string, name: string, type: string): Promise<DatabaseProperty> {
    return this.request<DatabaseProperty>(`/databases/${databaseId}/properties`, {
      method: "POST",
      body: JSON.stringify({ name, type }),
    });
  }

  async createDatabaseRow(databaseId: string, cells: Record<string, any> = {}): Promise<DatabaseRow> {
    return this.request<DatabaseRow>(`/databases/${databaseId}/rows`, {
      method: "POST",
      body: JSON.stringify({ cells }),
    });
  }

  async updateDatabaseCell(rowId: string, propertyId: string, value: any): Promise<any> {
    return this.request<any>(`/databases/rows/${rowId}/cells`, {
      method: "PATCH",
      body: JSON.stringify({ property_id: propertyId, value }),
    });
  }

  async deleteDatabaseRow(rowId: string): Promise<any> {
    return this.request<any>(`/databases/rows/${rowId}`, {
      method: "DELETE",
    });
  }

  // Search
  async search(workspaceId: string, query: string): Promise<{ total: number; results: SearchResult[] }> {
    return this.request<{ total: number; results: SearchResult[] }>(
      `/search/workspace/${workspaceId}?q=${encodeURIComponent(query)}`
    );
  }

  // AI
  async getAIStatus(): Promise<AIStatus> {
    return this.request<AIStatus>(`/ai/status`);
  }

  async chatWithAI(workspaceId: string, prompt: string, pageId?: string): Promise<AIChatResponse> {
    return this.request<AIChatResponse>(`/ai/chat/workspace/${workspaceId}`, {
      method: "POST",
      body: JSON.stringify({ prompt, page_id: pageId }),
    });
  }

  // Health
  async getHealth(): Promise<any> {
    return this.request<any>(`/health`);
  }
}

export const api = new APIClient();
