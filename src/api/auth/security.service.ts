import { JsonDoc, privacy } from "../jsonDocument/jsonDoc.model";

class SecurityService {

  public authorizedRetrieval(userId: string, jsonDoc: JsonDoc): boolean {

    if (jsonDoc.privacy === privacy.public) return true;

    if (!userId) return false;
    //TODO: Future work connect it with dock access (//NOTE: the dock access is like a revoke token)

    const idx: number = jsonDoc.members.findIndex(member => userId === member.userId);

    return idx !== -1;

  }

}


export default new SecurityService();