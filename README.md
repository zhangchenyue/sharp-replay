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

By default, the tool will run infinitly with auto-recompution every 1 min, the recompution range would be random.The data source file would loop send message, it would go from begining if the data item at the end.

> Auto create well and job, start streaming with recomputation (sprt)

<p align="center"><img src="https://media.giphy.com/media/QxMwUbZCsixaZeSzEz/giphy.gif"/></p>

> Auto create well and job, start streaming without recomputation (sprt -nr)

<p align="center"><img src="https://media.giphy.com/media/J3MYvgNjFAvsbhoVac/giphy.gif"/></p>

> Delete wells by well name like '-NodeJ-'

<p align="center"><img src="https://media.giphy.com/media/WrynX9bd7KYSdgkyd3/giphy.gif"/></p>

**Parameters**

#### Usage: sprt [options]

Options:

- -v, --version (output the current version)
- -p, --path \<filepath> (Specify the channel data csv file path)
- -w, --well \<wellId> (Specify the well id to send)
- -j, --job \<jobId> (Specify the job id)
- -d, --delete \<wellId> (Delete a well by id)
- -nr, --no-recompute (Send data without recomputation)
- -c, --clean \<wellName> (Clean wells by keykwords of well name, e.g "NodeJ")
- -h, --help (display help for command)

#### How to switch environment

Windows

```bash
set targetEnv=demohelios
sprt
```

Linux

```bash
targetEnv=demohelios
sprt
```

## License

MIT
