<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Device;
use App\Services\Zkteco\ZktecoConnectionFactory;
use App\Services\Zkteco\ZktecoDeviceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Doubles\FakeZkteco;
use Tests\Doubles\FakeZktecoConnectionFactory;
use Tests\TestCase;

class DeviceUserEditTest extends TestCase
{
    use RefreshDatabase;

    private function device(): Device
    {
        return Device::create(['name' => 'D', 'ip_address' => '192.168.1.201', 'port' => 4370]);
    }

    private function bindFake(FakeZkteco $fake): void
    {
        $this->app->instance(ZktecoConnectionFactory::class, new FakeZktecoConnectionFactory($fake));
    }

    public function test_the_service_writes_an_edited_user_to_a_slot(): void
    {
        $device = $this->device();
        $fake = new FakeZkteco;
        $this->bindFake($fake);

        $result = $this->app->make(ZktecoDeviceService::class)->setDeviceUser($device, 7, [
            'user_id' => '1001',
            'name_ascii' => 'Alice',
            'password' => '1234',
            'card_number' => null,
            'privilege' => 'admin',
        ]);

        $this->assertTrue($result['ok']);
        $this->assertCount(1, $fake->pushed);
        $this->assertSame(7, $fake->pushed[0]['uid']);
        $this->assertSame('1001', $fake->pushed[0]['userid']);
        $this->assertSame(14, $fake->pushed[0]['role']); // admin
    }

    public function test_the_service_removes_and_clears_users(): void
    {
        $device = $this->device();
        $fake = new FakeZkteco;
        $this->bindFake($fake);
        $service = $this->app->make(ZktecoDeviceService::class);

        $this->assertTrue($service->removeDeviceUser($device, 3)['ok']);
        $this->assertSame([3], $fake->removed);

        $this->assertTrue($service->clearDeviceUsers($device)['ok']);
        $this->assertTrue($fake->cleared);
    }

    public function test_the_update_endpoint_edits_a_device_user(): void
    {
        $device = $this->device();
        $fake = new FakeZkteco;
        $this->bindFake($fake);

        $this->put("/devices/{$device->id}/users/5", [
            'user_id' => '2002',
            'name' => 'Bob',
            'password' => '5678',
            'privilege' => 'user',
        ])->assertRedirect();

        $this->assertCount(1, $fake->pushed);
        $this->assertSame(5, $fake->pushed[0]['uid']);
        $this->assertSame('Bob', $fake->pushed[0]['name']);
    }

    public function test_the_delete_endpoint_removes_a_device_user(): void
    {
        $device = $this->device();
        $fake = new FakeZkteco;
        $this->bindFake($fake);

        $this->delete("/devices/{$device->id}/users/9")->assertRedirect();

        $this->assertSame([9], $fake->removed);
    }

    public function test_an_invalid_edit_is_rejected_without_writing(): void
    {
        $device = $this->device();
        $fake = new FakeZkteco;
        $this->bindFake($fake);

        $this->put("/devices/{$device->id}/users/5", [
            'user_id' => '2002',
            'name' => 'Bob',
            'password' => '12ab', // not digits — invalid PIN
            'privilege' => 'user',
        ])->assertRedirect()->assertSessionHas('error');

        $this->assertCount(0, $fake->pushed);
    }
}
