import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

import consul from '../core/consul';
import { getTokenAsync } from '../providers/token.provider';

const WELL_NAME_PREFIX = 'Helios-NodeJ-';

export async function createWellAsync(id: string = '', name: string = '') {
  const wellBaseURL = await consul('Uri-Slb.Prism.Core.Service.Well-2');
  const tenantId = await consul('Delfi-Test-Tenant-Id');
  const wellId = id || uuidv4();
  const wellName = `${WELL_NAME_PREFIX}${name}-${wellId}`;
  const token = await getTokenAsync();
  const wellURL = `${wellBaseURL}${wellId}?slb-data-partition-id=${tenantId}`;

  const { data } = await axios.post(
    `${wellURL}`,
    {
      Name: wellName,
      Company: 'Schlumberger Helios',
      TimeZone: '-06:00',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return { ...data, name: wellName };
}

export async function fetchWellByIdAsync(wellId: string) {
  const wellBaseURL = await consul('Uri-Slb.Prism.Core.Service.Well-2');
  const tenantId = await consul('Delfi-Test-Tenant-Id');
  const token = await getTokenAsync();
  const wellURL = `${wellBaseURL}${wellId}?slb-data-partition-id=${tenantId}`;

  try {
    const { data } = await axios.get(`${wellURL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { ...data };
  } catch (error) {
    return null;
  }
}

export async function deleteWellAsync(wellId: string = '') {
  const wellBaseURL = await consul('Uri-Slb.Prism.Core.Service.Well-2');
  const tenantId = await consul('Delfi-Test-Tenant-Id');
  const token = await getTokenAsync();
  const wellURL = `${wellBaseURL}${wellId}?slb-data-partition-id=${tenantId}`;
  try {
    return await axios.delete(`${wellURL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Fail to delete well: ', wellId);
    return Promise.resolve(wellId);
  }
}

export async function deleteAllNodeToolCreatedWellAsync(wellNameLike: string = 'NodeJ') {
  const aggregatorURL = await consul('Uri-Slb.Prism.Portal.Service.Aggregator-1');
  const token = await getTokenAsync();
  const {
    data: {
      data: { wells },
    },
  } = await axios.post(
    `${aggregatorURL}graphql`,
    {
      query: '{\nwells\n{\ncreationTime\nid\nname\n}\n}',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const toBeDeleteWells = wells.filter((well: any) => well.name && well.name.includes(wellNameLike));
  const toBeDeleteWellsPromise = toBeDeleteWells.map(({ id }: any) => deleteWellAsync(id));
  let num = 0;
  for await (const dwell of toBeDeleteWellsPromise) {
    const { name, id } = toBeDeleteWells[num];
    console.log('Deleted well ', chalk.cyanBright(`name: ${name}, id: ${id}`));
    num++;
  }
  console.log('total ', chalk.cyanBright(`${num}`), ' wells have been deleted');
}
