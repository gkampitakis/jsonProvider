import { Router } from 'express';
import controller from './jsonDoc.controller';
import { TokenController } from "../auth/token/token.controller";
import { Container } from "typedi";


const controllerDI: controller = Container.get(controller);
const tokenController: TokenController = new TokenController();
const jsonDocRouter: Router = Router();

jsonDocRouter.use(tokenController.prepareRequestUser);

jsonDocRouter.get('/:id', controllerDI.retrieve);
jsonDocRouter.delete('/:id', controllerDI.remove);
jsonDocRouter.post('/', controllerDI.create);
jsonDocRouter.put('/:id', controllerDI.update);

/** Privacy */ //TODO: in future we should email notifications here
jsonDocRouter.put('/privacy/:id/:privacy', controllerDI.updatePrivacy);
jsonDocRouter.put('/member/:id/add/:userId/:access', controllerDI.addMember);
jsonDocRouter.put('/member/:id/remove/:userId', controllerDI.removeMember);

export default jsonDocRouter;