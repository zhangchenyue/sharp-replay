# sharp-replay

sharp-replay is a kind of replay tool which is in pure Javascript. It could send Prism message and simulate data streaming, recomputation to the Prism platform.

## Features

- Well Creation
- Job Creation
- Job Setup
- Channel data streaming
- Auto-Recomputation
- Delete well by well Id
- Delele wells by name like

## Quick Start

**Runtime**

| Node | Npm |
| ---- | --- |
| v12+ | v6+ |

**Install**

```bash
# install pkg
npm i -g sharp-replay --registry=http://163.184.146.22/
```

**Run**

```bash
sprt
```

**Parameters**

#### Usage: sprt [options]

Options:

- -v, --version (output the current version)
- -p, --path \<filepath> (Specify the channel data csv file path)
- -w, --well \<wellId> (Specify the well id to send)
- -j, --job \<jobId> (Specify the job id)
- -d, --delete \<wellId> (Delete a well by id)
- -c, --clean \<wellName> (Clean wells by keykwords of well name, e.g "NodeJ")
- -h, --help (display help for command)

## License

MIT
