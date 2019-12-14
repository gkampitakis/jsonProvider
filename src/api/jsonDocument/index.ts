import { Router } from 'express';
import controller from './jsonDoc.controller';
import utils from '../../util/helper.service';

const jsonDocRouter = Router();

jsonDocRouter.use(utils.prepareRequestUser);

jsonDocRouter.get('/:id', controller.retrieve);
jsonDocRouter.delete('/:id', controller.remove);
jsonDocRouter.post('/', controller.create);
jsonDocRouter.put('/:id', controller.update);

/** Privacy */ //TODO: in future we should email notifications here
jsonDocRouter.put('/privacy/:id/:privacy', controller.updatePrivacy);
jsonDocRouter.put('/member/:id/add/:userId/:access', controller.addMember);
jsonDocRouter.put('/member/:id/remove/:userId', controller.removeMember);

export default jsonDocRouter;