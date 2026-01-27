import { SearchRepository } from "./search.repository";

export class SearchService {
  private readonly repo = new SearchRepository();

  async suggest(user: any, q: string, limit?: number) {
    return this.repo.suggest(user, q, limit ?? 10);
  }

  async global(user: any, q: string, types?: string, limit?: number) {
    const parsedTypes = SearchRepository.parseTypes(types);
    return this.repo.globalSearch(user, q, parsedTypes, limit ?? 20);
  }
}
