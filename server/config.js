const fs = require('fs')
const path = require('path')
const { getAbsolutePath } = require("./utils");

const ensurePathExists = (p) => {
    if (!fs.existsSync(p)) {
        console.log("ERROR. Path", p, "doesn't exist.");
        process.exit(1);
    }
}

const parseConfig = (args) => {
    const configDir = path.dirname(getAbsolutePath(args.config));
    let config = JSON.parse(fs.readFileSync(getAbsolutePath(args.config)));

    /* check config file has the appropriate fields... */

    /* sort out paths */
    config.referenceConfigPath = getAbsolutePath(config.referenceConfigPath, {relativeTo: configDir});
    config.referencePanelPath = getAbsolutePath(config.referencePanelPath, {relativeTo: configDir});
    config.basecalledPath = getAbsolutePath(config.basecalledPath, {relativeTo: configDir});
    config.demuxedPath = getAbsolutePath(config.demuxedPath, {relativeTo: configDir});

    /* check if paths exist (perhaps we could make them if they don't) */
    ensurePathExists(config.referenceConfigPath);
    ensurePathExists(config.referencePanelPath);
    if (!global.args.startWithDemuxedReads) {
        ensurePathExists(config.basecalledPath);
    }
    ensurePathExists(config.demuxedPath);

    /* parse the "main reference" configuration file (e.g. primers, genes, ref seq etc) */
    const secondConfig = JSON.parse(fs.readFileSync(config.referenceConfigPath));
    config = {...config, ...secondConfig};

    /* get the names of the sequences in the reference panel */
    config.referencePanel = fs.readFileSync(config.referencePanelPath, "utf8")
        .split("\n")
        .filter((l) => l.startsWith(">"))
        .map((n) => {
            if (n.indexOf(" ") > 0) {
                return {
                    "name": n.substring(1, n.indexOf(" ")), // fasta name is up until the first space
                    "description": n.substring(n.indexOf(" ")) // fasta description is the rest
                };
            } else {
                return {
                    "name": n.substring(1),
                    "description": ""
                };
            }
        }); // remove the > character

    /* things that may be put into the config JSON in the future */
    config.maxMappingFilesPerRequest = 10;

    return config;
}

module.exports = {
    parseConfig
};
