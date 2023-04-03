// Packages
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
] });
const fs = require('fs');

// Config
const { token, owner, globalLogs, servers } = require('./system/config.json');
let fetchedServers = [];

// Listeners
client.on("ready", async () => {

    // slash commands
    require('./system/slash').run(client);

    // log
    console.log(`--> Bot online`);

    // fetch all servers
    for(i in servers) {
        fetchedServers.push((await client.guilds.fetch(servers[i].guild)));
    }
});
client.on("interactionCreate", async interaction => {

    // authorised?
    if(fs.existsSync(`./system/blocked/${interaction.user.id}.json`)) {
        embed = new EmbedBuilder()
            .setColor('DarkRed')
            .setDescription(`You are not permitted to use these commands.`)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        await interaction.reply({ embeds: [embed] });
        return
    }

    // commands
    if(interaction.commandName == `ban`) {

        // defer
        await interaction.deferReply();

        // parse
        const member = interaction.options._hoistedOptions[0].member;
        const reason = interaction.options._hoistedOptions[1].value;

        // valid roles?
        if(!interaction.member.roles.cache.has(servers.filter(t => t.guild == interaction.guild.id)[0].executive) && !interaction.member.roles.cache.has(servers.filter(t => t.guild == interaction.guild.id)[0].coordinator)) {
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle('Error')
                .setDescription(`Only executives and department coordinators are permitted to use this command.`)
            await interaction.editReply({ embeds: [embed] });
            return
        }

        // banning an exec?
        if(member.roles.cache.has(servers.filter(t => t.guild == interaction.guild.id)[0].executive)) {
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle('Error')
                .setDescription(`You cannot ban an executive.`)
            await interaction.editReply({ embeds: [embed] });
            return
        }

        // issue bans
        for(i in fetchedServers) {
            await fetchedServers[i].bans.create(member.user.id).catch(err => console.warn(`Missing permissions to ban members in ${fetchedServers[i].name}`));
        }

        // DM user
        embed = new EmbedBuilder()
            .setTitle('Global Ban Issued')
            .setColor('Orange')
            .setDescription(`You have been globally banned.`)
        await member.user.send({ embeds: [embed] }).catch(err => {});

        // log
        embed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle('Global Ban Issued')
            .setDescription(`${interaction.user.toString()} (${interaction.user.tag}) has globally banned ${member.user.toString()} (${member.user.tag}) for \`${reason}\`.`)
            .setFooter({ text: `User ID: ${member.user.id}` })
        await (await client.guilds.cache.get(globalLogs.guild).channels.fetch(globalLogs.channel)).send({ embeds: [embed] });

        // reply
        embed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle('Global Ban Issued')
            .setTimestamp()
            .setDescription(`You have globally banned ${member.user.toString()} (${member.user.tag}) for \`${reason}\`.`);
        await interaction.editReply({ embeds: [embed] });
    }
    if(interaction.commandName == `unban`) {

        // defer
        await interaction.deferReply();

        // parse
        const uID = interaction.options._hoistedOptions[0].value;

        // valid ID?
        if(isNaN(uID)) {
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle('Error')
                .setDescription(`Please provide a valid user ID. E.g. 1231231231231`)
            await interaction.editReply({ embeds: [embed] });
            return
        }

        // valid roles?
        if(!interaction.member.roles.cache.has(servers.filter(t => t.guild == interaction.guild.id)[0].executive) && !interaction.member.roles.cache.has(servers.filter(t => t.guild == interaction.guild.id)[0].coordinator)) {
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle('Error')
                .setDescription(`Only executives and department coordinators are permitted to use this command.`)
            await interaction.editReply({ embeds: [embed] });
            return
        }

        // remove bans
        for(i in fetchedServers) {
            await fetchedServers[i].bans.remove(uID).catch(err => {}); // ban not found
        }

        // log
        embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Global Ban Removed')
            .setTimestamp()
            .setDescription(`${interaction.user.toString()} (${interaction.user.tag}) has globally unbanned \`${uID}\`.`);
        await (await client.guilds.cache.get(globalLogs.guild).channels.fetch(globalLogs.channel)).send({ embeds: [embed] });

        // reply
        embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Global Ban Removed')
            .setTimestamp()
            .setDescription(`You have globally unbanned \`${uID}\`.`);
        await interaction.editReply({ embeds: [embed] });
    }
    if(interaction.commandName == `coordinator`) {

        // defer
        await interaction.deferReply();

        // parse
        const member = interaction.options._hoistedOptions[0].member;

        // valid roles?
        if(!interaction.member.roles.cache.has(servers.filter(t => t.guild == interaction.guild.id)[0].executive) && !interaction.member.roles.cache.has(servers.filter(t => t.guild == interaction.guild.id)[0].coordinator)) {
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle('Error')
                .setDescription(`Only executives and department coordinators are permitted to use this command.`)
            await interaction.editReply({ embeds: [embed] });
            return
        }

        // issue bans
        for(i in fetchedServers) {
            m = (await fetchedServers[i].members.fetch())?.map(t => t)?.filter(t => t.user.id == member.user.id)[0];
            if(m && !m.roles.cache.has(servers.filter(t => t.guild == fetchedServers[i].id)[0].coordinator)) {
                await m.roles.add(servers.filter(t => t.guild == fetchedServers[i].id)[0].coordinator).catch(err => console.warn(`Missing permissions to assign roles in ${fetchedServers[i].name}`))
            } 
        }

        // log
        embed = new EmbedBuilder()
            .setColor('DarkBlue')
            .setTitle('Coordinator Role Issued')
            .setDescription(`${interaction.user.toString()} (${interaction.user.tag}) has granted ${member.user.toString()} (${member.user.tag}) the coordinator role globally.`)
        await (await client.guilds.cache.get(globalLogs.guild).channels.fetch(globalLogs.channel)).send({ embeds: [embed] });

        // reply
        embed = new EmbedBuilder()
            .setColor('DarkBlue')
            .setTitle('Coordinator Role Issued')
            .setTimestamp()
            .setDescription(`You have granted ${member.user.toString()} (${member.user.tag}) the coordinator role globally.`);
        await interaction.editReply({ embeds: [embed] });
    }
    if(interaction.commandName == `block`) {

        // defer
        await interaction.deferReply();

        // parse
        const member = interaction.options._hoistedOptions[0].member;

        // valid roles?
        if(!interaction.member.roles.cache.has(servers.filter(t => t.guild == interaction.guild.id)[0].executive)) {
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle('Error')
                .setDescription(`Only executives are permitted to use this command.`)
            await interaction.editReply({ embeds: [embed] });
            return
        }

        // self-block?
        if(member.user.id == interaction.user.id) {
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle('Error')
                .setDescription(`You cannot block yourself.`)
            await interaction.editReply({ embeds: [embed] });
            return
        }

        // issue block
        fs.writeFileSync(`./system/blocked/${member.user.id}.json`, JSON.stringify({ time: Date.now() }, null, 4));

        // log
        embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('Block Issued')
            .setDescription(`${interaction.user.toString()} (${interaction.user.tag}) has blocked ${member.user.toString()} (${member.user.tag}) from using all slash commands.`)
        await (await client.guilds.cache.get(globalLogs.guild).channels.fetch(globalLogs.channel)).send({ embeds: [embed] });

        // reply
        embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('Block Issued')
            .setTimestamp()
            .setDescription(`You have blocked ${member.user.toString()} (${member.user.tag}) from using all slash commands.`);
        await interaction.editReply({ embeds: [embed] });
    }
    if(interaction.commandName == `unblock`) {

        // defer
        await interaction.deferReply();

        // parse
        const member = interaction.options._hoistedOptions[0].member;

        // valid roles?
        if(!interaction.member.roles.cache.has(servers.filter(t => t.guild == interaction.guild.id)[0].executive)) {
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle('Error')
                .setDescription(`Only executives are permitted to use this command.`)
            await interaction.editReply({ embeds: [embed] });
            return
        }

        // remove block
        try {
            fs.unlinkSync(`./system/blocked/${member.user.id}.json`);
        } catch(err) {};

        // log
        embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('Block Removed')
            .setDescription(`${interaction.user.toString()} (${interaction.user.tag}) has unblocked ${member.user.toString()} (${member.user.tag}) from using all slash commands.`)
        await (await client.guilds.cache.get(globalLogs.guild).channels.fetch(globalLogs.channel)).send({ embeds: [embed] });

        // reply
        embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('Block Removed')
            .setTimestamp()
            .setDescription(`You have unblocked ${member.user.toString()} (${member.user.tag}) from using all slash commands.`);
        await interaction.editReply({ embeds: [embed] });
    }
    if(interaction.commandName == `ping`) {
        embed = new EmbedBuilder()
            .setColor('DarkBlue')
            .setTitle('🏓 Ping')
            .setDescription(`The current ping is \`${client.ws.ping}ms\`.`)
        await interaction.reply({ embeds: [embed] });
    }
    if(interaction.commandName == `stats`) {
        embed = new EmbedBuilder()
            .setColor('DarkBlue')
            .setTitle('❓ Stats')
            .addFields(
                { name: `Uptime`, value: `Since <t:${Math.floor((Date.now() - interaction.client.uptime)/1000)}:R>` },
                { name: `Guilds`, value: `${client.guilds.cache.size}` },
                { name: `Bot Owner`, value: `<@${owner}>` }
            )
        await interaction.reply({ embeds: [embed] });
    }
});

// Login
client.login(token);