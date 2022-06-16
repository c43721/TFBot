import type { IEntityRepository } from "./IEntityRepository";
import type { ApiRequest, ApiResponse, AuthData } from "@sapphire/plugin-api";
import { container } from "@sapphire/framework";
import type { Model } from "mongoose";

export class EntityRepository<TModel extends typeof Model, TEntity>
  implements IEntityRepository<TEntity>
{
  protected repository: TModel;
  protected request: ApiRequest;
  protected response: ApiResponse;
  protected identity?: AuthData | null;
  protected logger = container.logger;

  constructor(
    repository: TModel,
    request: ApiRequest,
    response: ApiResponse,
    identity: AuthData
  ) {
    this.repository = repository;
    this.request = request;
    this.response = response;
    this.identity = identity;
  }

  preGet(_id: string) {}

  prePatch(_obj: TEntity, _obj2: TEntity) {}

  preDelete(_obj: TEntity) {}

  postGet(_obj: TEntity) {}

  postPatch(_obj: TEntity, _obj2: TEntity) {}

  postDelete(_obj: TEntity) {}

  public async get(id: string) {
    await this.preGet(id);

    const data = await this.repository.findById(id, {}).lean();

    await this.postGet(data!);
    return data;
  }

  public async getMany(ids: string[]) {
    const preGetPromises = ids.map(async (id) => this.preGet(id));
    await Promise.all(preGetPromises);

    const data = await this.repository.find({ _id: { $in: ids } });

    const postGetPromises = data.map(async (obj) => this.postGet(obj));
    await Promise.all(postGetPromises);

    return data;
  }

  public async patch(id: string, obj: Partial<TEntity>) {
    const prevDat = await this.get(id);
    await this.prePatch(prevDat, { ...prevDat, ...obj });

    const data = await this.repository
      .findByIdAndUpdate(id, obj)
      .orFail()
      .lean();

    await this.postPatch(prevDat, data);
    return data;
  }

  public async delete(id: string) {
    const existing = await this.get(id);
    await this.preDelete(existing);

    const data = await this.repository.findByIdAndDelete(id);

    await this.postDelete(existing);
    return data;
  }
}
