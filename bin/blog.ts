#!/usr/bin/env node
import 'source-map-support/register';
import {App} from '@aws-cdk/core';
import {BlogStack} from '../lib/BlogStack';
import {Environment} from "@aws-cdk/core/lib/environment";

const envIreland: Environment = {account: '463361892799', region: 'eu-west-1'};

const app = new App();
new BlogStack(app, 'BlogStack', {env: envIreland});
