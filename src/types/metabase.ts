/**
 * TypeScript types for Metabase API responses and requests
 */

export interface MetabaseConfig {
  url: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface Dashboard {
  id: number;
  name: string;
  description?: string;
  collection_id?: number;
  archived?: boolean;
  parameters?: any[];
  cards?: DashboardCard[];
  dashcards?: DashboardCard[];
}

export interface DashboardCard {
  id: number;
  card_id: number;
  dashboard_id: number;
  row: number;
  col: number;
  sizeX: number;
  sizeY: number;
  parameter_mappings?: any[];
  visualization_settings?: any;
}

export interface Card {
  id: number;
  name: string;
  description?: string;
  collection_id?: number;
  collection?: Collection;
  archived?: boolean;
  archived_directly?: boolean;
  dataset_query: any;
  display: string;
  visualization_settings: any;
  type?: string;
  query_type?: string;
  database_id?: number;
  table_id?: number;
  creator_id?: number;
  creator?: User;
  created_at?: string;
  updated_at?: string;
  last_used_at?: string;
  view_count?: number;
  cache_invalidated_at?: string;
  cache_ttl?: number | null;
  collection_position?: number | null;
  source_card_id?: number | null;
  result_metadata?: any[];
  initially_published_at?: string | null;
  card_schema?: number;
  enable_embedding?: boolean;
  made_public_by_id?: number | null;
  embedding_params?: any | null;
  entity_id?: string;
  collection_preview?: boolean;
  "last-edit-info"?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    timestamp: string;
  };
  metabase_version?: string;
  parameters?: any[];
  parameter_mappings?: any[];
  dashboard_id?: number;
  public_uuid?: string | null;
}

export interface Database {
  id: number;
  name: string;
  engine: string;
  details: any;
  auto_run_queries?: boolean;
  is_full_sync?: boolean;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  color?: string;
  parent_id?: number;
  archived?: boolean;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active?: boolean;
  is_superuser?: boolean;
  group_ids?: number[];
}

export interface Table {
  id: number;
  name: string;
  display_name?: string;
  database_id: number;
  schema?: string;
}

export interface Field {
  id: number;
  name: string;
  display_name?: string;
  table_id: number;
  database_type: string;
  base_type: string;
}

export interface PermissionGroup {
  id: number;
  name: string;
}

export interface QueryResult {
  data: any;
  status: string;
  row_count?: number;
  running_time?: number;
}
