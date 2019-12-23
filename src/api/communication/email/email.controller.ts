import { Transporter, createTransport } from 'nodemailer';
import sendGrid from 'nodemailer-sendgrid';
import hbs from 'nodemailer-express-handlebars';
import validator from 'validator';
import path from 'path';
import { Configurator } from '../../../config/configurator';

class EmailController {

  @Configurator("keys.sendgrid",
    "communication.email.supportedTemplates")
  private config;

  public async send(receiver: string, subject: string, payload: any, template?: string) {

    if (!validator.isEmail(receiver)) throw Error('Please support valid email');

    const transporter: Transporter = this.createTransporter(template);

    const mailPayload = {
      from: 'no-reply@jsonProvider.dev',
      to: receiver,
      subject: subject,
      text: payload?.text,
      template: template,
      context: payload
    };

    return transporter.sendMail(mailPayload);

  }

  private createTransporter(template?: string): Transporter {

    const transporter: Transporter = createTransport(sendGrid({
      apiKey: this.config.sendgrid
    }));

    if (template && this.config.supportedTemplates.includes(template))
      transporter.use('compile', hbs({
        viewEngine: {
          extName: '.handlebars',//NOTE: stupid placeholders for handlebars package
          partialsDir: path.join(__dirname, './views/'),
          layoutsDir: path.join(__dirname, './views/'),
          defaultLayout: template + '.handlebars'
        },
        viewPath: path.join(__dirname, './views/')
      }));


    return transporter;

  }
}

export default new EmailController();