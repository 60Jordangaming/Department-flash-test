// Packages
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

// Config
const { token } = require('./config.json');

// Export
module.exports = {
    async run(client) {

        // form the commands
        commands = [
            new SlashCommandBuilder()
                .setName(`stats`)
                .setDescription(`View the bot's stats.`),
            new SlashCommandBuilder()
                .setName(`ping`)
                .setDescription(`Check the bot's ping.`),
            new SlashCommandBuilder()
                .setName(`unblock`)
                .setDescription(`Unblock a user from interacting with the bot.`)
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user.')
                        .setRequired(true)),
            new SlashCommandBuilder()
                .setName(`block`)
                .setDescription(`Block a user from interacting with the bot.`)
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user.')
                        .setRequired(true)),
            new SlashCommandBuilder()
                .setName(`globalcoordinator`)
                .setDescription(`Assign the coordinator role.`)
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user.')
                        .setRequired(true)),
            new SlashCommandBuilder()
                        .setName(`globalmanagement`)
                        .setDescription(`Assign the management role.`)
                        .addUserOption(option =>
                     option
                        .setName('user')
                        .setDescription('The user.')
                        .setRequired(true)),            
            new SlashCommandBuilder()
                .setName(`globalunban`)
                .setDescription(`Remove a global ban.`)
                .addStringOption(option =>
                    option
                        .setName('user-id')
                        .setDescription('The user id. E.g. 1231231231231')
                        .setRequired(true)),
            new SlashCommandBuilder()
                .setName(`globalban`)
                .setDescription(`Issue a global ban.`)
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user.')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('The reason.')
                        .setRequired(true)),
        ].map(command => command.toJSON());

        // set API version & Token
        rest = new REST({ version: '9' }).setToken(token);

        // push commands
        await rest.put(
			Routes.applicationCommands(client.user.id),
			{ body: commands },
		)
    }
}