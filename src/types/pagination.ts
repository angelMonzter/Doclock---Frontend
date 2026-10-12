export type PageRequest = {
  page: number;
  pageSize: number;
  search: string;
  status: string;
};

export type PageResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};
