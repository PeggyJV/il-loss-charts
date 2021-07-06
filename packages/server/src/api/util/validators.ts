import { celebrate, Joi, Segments } from 'celebrate';

import validateEthAddress from 'api/util/validate-eth-address';

import config from '@config';

const networks = Object.keys(config.uniswap.v3.networks);

// TODO: move this to utils
export const poolIdParamsSchema = Joi.object().keys({
    poolId: Joi.string()
        .custom(validateEthAddress, 'Validate Pool Id')
        .required(),
    network: Joi.string()
        .valid(...networks)
        .required(),
});

export const poolIdValidator = celebrate({
    [Segments.PARAMS]: poolIdParamsSchema,
});

export const networkSchema = Joi.object().keys({
    network: Joi.string()
        .valid(...networks)
        .required(),
});

export const networkValidator = celebrate({
    [Segments.PARAMS]: networkSchema,
});
