// @ts-nocheck
import type { IEntityRepository } from "./IEntityRepository";
import type { ApiRequest, ApiResponse, AuthData } from "@sapphire/plugin-api";
import { container } from "@sapphire/framework";
import type { Entity } from "../ServiceController";

export class EntityRepository<TEntity extends Entity> implements IEntityRepository<TEntity> {
  protected repository: TEntity;
  protected request: ApiRequest;
  protected response: ApiResponse;
  protected identity?: AuthData | null | undefined;
  protected logger = container.logger;

  constructor(repository: TEntity, request: ApiRequest, response: ApiResponse, identity: AuthData | null | undefined) {
    this.repository = repository;
    this.request = request;
    this.response = response;
    this.identity = identity;
  }

  preGet(_id: string) {}

  prePatch(_obj: Entity, _obj2: TEntity) {}

  preDelete(_obj: TEntity) {}

  postGet(_obj: TEntity) {}

  postPatch(_obj: TEntity, _obj2: TEntity) {}

  postDelete(_obj: TEntity) {}

  public async get(id: string) {
    await this.preGet(id);

    const data = await this.repository.findUnique({ where: { id } });

    await this.postGet(data!);
    return data;
  }

  public async post(id: string, obj: TEntity) {
    const data = await this.repository.upsert({
      where: { id },
      create: { id, ...obj },
      update: { ...obj },
    });

    return data as unknown as TEntity;
  }

  public async getMany(ids: string[]) {
    const preGetPromises = ids.map(async id => this.preGet(id));
    await Promise.all(preGetPromises);

    const data = await this.repository.findMany({
      where: { id: { in: ids } },
    });

    const postGetPromises = data.map(async obj => this.postGet(obj!));
    await Promise.all(postGetPromises);

    return data;
  }

  public async patch(id: string, obj: Partial<TEntity>) {
    const prevDat = await this.get(id);
    await this.prePatch(prevDat!, { ...prevDat, ...obj } as any);

    const data = await this.repository.update({ where: { id }, data: { ...obj } });

    await this.postPatch(prevDat!, data);
    return data;
  }

  public async delete(id: string) {
    const existing = await this.get(id);
    await this.preDelete(existing!);

    await this.repository.delete({ where: { id } });

    await this.postDelete(existing!);
    return true;
  }
}
