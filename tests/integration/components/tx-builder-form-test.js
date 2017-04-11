import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('tx-builder-form', 'Integration | Component | tx builder form', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{tx-builder-form}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#tx-builder-form}}
      template block text
    {{/tx-builder-form}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
