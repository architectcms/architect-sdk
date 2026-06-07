import { Command } from 'commander'
import { registerLogin } from './commands/login'
import { registerWhoami } from './commands/whoami'

const program = new Command()
program.name('architect').description('Architect CMS command-line tool').version('0.0.0')
registerLogin(program)
registerWhoami(program)
program.parseAsync(process.argv)
