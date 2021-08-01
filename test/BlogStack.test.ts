import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import {App} from '@aws-cdk/core';
import {BlogStack} from '../lib/BlogStack';

test('Empty Stack', () => {
    const app = new App();
    // WHEN
    const stack = new BlogStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
