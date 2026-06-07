import { Command } from 'commander'

const program = new Command()
program.name('architect').description('Architect CMS command-line tool').version('0.0.0')

program.parseAsync(process.argv)
