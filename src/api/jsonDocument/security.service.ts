import { JsonDoc, privacy, access } from "./jsonDoc.model";

class SecurityService {

  public authorizedRetrieval(userId: string, jsonDoc: JsonDoc): boolean {

    if (jsonDoc.privacy === privacy.public) return true;

    //TODO: Future work connect it with dock access (//NOTE: the dock access is like a revoke token)

    if (!userId) return false;

    const idx: number = jsonDoc.members.findIndex(member => userId === member.userId);

    return idx !== -1;

  }

  public isAdmin(userId: string, jsonDoc: JsonDoc): boolean {

    if (!userId) return false;

    const idx: number = jsonDoc.members.findIndex(member => userId === member.userId
      && member.access === access.admin);

    return idx !== -1;

  }

  public authorizedUpdate(userId: string, jsonDoc: JsonDoc): boolean {
    //FIXME: only if he is registered someone can do changes
    if (!userId) return false;

    const idx: number = jsonDoc.members.findIndex(member => userId === member.userId
      && member.access >= access.write);

    return idx !== -1;

  }

}


export default new SecurityService();